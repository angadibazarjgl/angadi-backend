const express = require("express");
const supabase = require("../config/supabase");
const authenticate = require("../middleware/auth");

const router = express.Router();

/*
==========================================
MY ORDERS
GET /api/orders
==========================================
*/
router.get("/", authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
  *,
  order_items(*)
`)
      .eq("user_id", req.user.id)
      .order("id", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      orders: data,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/*
==========================================
ORDER DETAILS
GET /api/orders/:id
==========================================
*/
router.get("/:id", authenticate, async (req, res) => {
  try {
    const orderId = req.params.id;

    // Get Order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", req.user.id)
      .single();

    if (orderError) throw orderError;

    // Get Order Items
    const { data: items, error: itemError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (itemError) throw itemError;

    res.json({
      success: true,
      order,
      items
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

/*
==========================================
PLACE ORDER
POST /api/orders
==========================================
*/
router.post("/", authenticate, async (req, res) => {
  try {
    const {
  items = [],

  payment_method,
  delivery_slot,
  coupon_code = null,

  customer_name,
  customer_phone,
  receiver_phone,

  address_label,
  address_text,

  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,

  lat,
  lng
} = req.body;

console.log("Customer Name:", customer_name);
console.log("Customer Phone:", customer_phone);

console.log("JWT decoded:", req.user);

const user_id = req.user.id;

console.log("Order user_id:", user_id);

    if (!items.length) {
  return res.status(400).json({
    success: false,
    message: "Cart is empty",
  });
}

// Load all requested variants
const variantIds = items.map(i => i.variant_id);

const { data: variants, error: variantError } = await supabase
  .from("product_variants")
  .select(`
    id,
    label,
    price,
    stock,
    product_id
  `)
  .in("id", variantIds);

if (variantError) throw variantError;

// Load products
const productIds = variants.map(v => v.product_id);

const { data: products, error: productError } = await supabase
  .from("products")
  .select("id,name,image")
  .in("id", productIds);

if (productError) throw productError;

    let subtotal = 0;

for (const item of items) {
  const variant = variants.find(v => v.id === item.variant_id);

  if (!variant) {
    throw new Error(`Variant ${item.variant_id} not found`);
  }

  subtotal += variant.price * item.quantity;
}

    const delivery_fee = subtotal >= 300 ? 0 : 30;

    const discount = 0;
    const total = subtotal + delivery_fee - discount;

    // Generate a unique monthly order code from PostgreSQL
const { data: order_code, error: orderCodeError } =
  await supabase.rpc("generate_order_code");

if (orderCodeError) throw orderCodeError;

    // Create Order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
  user_id,
  order_code,

  status: "placed",

payment_method,

razorpay_order_id,
razorpay_payment_id,
razorpay_signature,

payment_status:
  payment_method === "cod"
    ? "Pending"
    : "Paid",

  subtotal,
  delivery_fee,
  discount,
  total,

  coupon_code,
  delivery_slot,

  customer_name,
  customer_phone,
  receiver_phone,

  address_label,
  address_text,

  lat,
  lng
})
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert Items
    const orderItems = items.map(item => {
  const variant = variants.find(v => v.id === item.variant_id);
  const product = products.find(p => p.id === variant.product_id);

  return {
    order_id: order.id,
    product_id: product.id,
    product_name: product.name,
    variant_label: variant.label,
    image: product.image,
    price: variant.price,
    qty: item.quantity,
  };
});

    const { error: itemError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemError) throw itemError;

    const { data: fullOrder, error: fullError } = await supabase
  .from("orders")
  .select(`
    *,
    order_items(*)
  `)
  .eq("id", order.id)
  .single();

if (fullError) throw fullError;

    // Reduce Stock
for (const item of items) {
  // Get current stock
  const { data: variant, error: stockError } = await supabase
    .from("product_variants")
    .select("stock")
    .eq("id", item.variant_id)
    .single();

  if (stockError) throw stockError;

  const newStock = Math.max(0, variant.stock - item.quantity);

  const { error: updateError } = await supabase
    .from("product_variants")
    .update({ stock: newStock })
    .eq("id", item.variant_id);

  if (updateError) throw updateError;
}

    // Clear Cart
    await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user_id);

    res.json({
  success: true,
  message: "Order placed successfully",
  order: fullOrder
});

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

/*
==========================================
CANCEL ORDER
PATCH /api/orders/:id/cancel
==========================================
*/
router.patch("/:id/cancel", authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from("orders")
      .update({
        status: "cancelled"
      })
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: "Order cancelled successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

/*
==========================================
ORDER TRACKING
GET /api/orders/:id/tracking
==========================================
*/
router.get("/:id/tracking", authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
  .from("orders")
  .select(`
    id,
    order_code,
    status,
    payment_method,
    payment_status,
    subtotal,
    delivery_fee,
    discount,
    total,
    delivery_slot
  `)
  .eq("id", req.params.id)
  .eq("user_id", req.user.id)
  .single();

    if (error) throw error;

    res.json({
      success: true,
      tracking: data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;
