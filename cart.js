const express = require("express");
const supabase = require("../config/supabase");
const authenticate = require("../middleware/auth");

const router = express.Router();

/*
==========================================
ADD TO CART
POST /api/cart
==========================================
*/
router.post("/", authenticate, async (req, res) => {
  try {
    const { variant_id, quantity = 1 } = req.body;
    const user_id = req.user.id;

    if (!variant_id) {
      return res.status(400).json({
        success: false,
        message: "Variant ID is required",
      });
    }

    // Check if item already exists
    const { data: existing, error: checkError } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user_id)
      .eq("variant_id", variant_id)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      const { error } = await supabase
        .from("cart_items")
        .update({
          quantity: existing.quantity + quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("cart_items")
        .insert({
          user_id,
          variant_id,
          quantity,
        });

      if (error) throw error;
    }

    res.json({
      success: true,
      message: "Item added to cart successfully",
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/*
==========================================
GET CART
GET /api/cart
==========================================
*/
router.get("/", authenticate, async (req, res) => {
  try {
    const user_id = req.user.id;

    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        id,
        quantity,
        product_variants (
          id,
          label,
          mrp,
          price,
          stock,
          products (
            id,
            name,
            name_te,
            image
          )
        )
      `)
      .eq("user_id", user_id);

    if (error) throw error;

    res.json({
      success: true,
      cart: data,
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
UPDATE CART QUANTITY
PATCH /api/cart/:id
==========================================
*/
router.patch("/:id", authenticate, async (req, res) => {
  try {
    const { quantity } = req.body;

    const { error } = await supabase
      .from("cart_items")
      .update({
        quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: "Cart updated successfully",
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
REMOVE ITEM
DELETE /api/cart/:id
==========================================
*/
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: "Item removed successfully",
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
CLEAR CART
DELETE /api/cart
==========================================
*/
router.delete("/", authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: "Cart cleared successfully",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;