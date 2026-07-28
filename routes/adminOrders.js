const express = require("express");
const supabase = require("../config/supabase");

const router = express.Router();

/*
==========================================
UPDATE ORDER STATUS
PATCH /api/admin/orders/:id/status
==========================================
*/
router.patch("/orders/:id/status", async (req, res) => {
  console.log("====== ADMIN STATUS API CALLED ======");
  try {
    const { status } = req.body;

    console.log("Status received:", status);

    const allowedStatus = [
      "Placed",
      "Packing",
      "Packed",
      "Shipped",
      "Delivered",
      "Cancelled"
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status"
      });
    }

    // Get current order
const { data: existingOrder, error: fetchError } = await supabase
  .from("orders")
  .select("payment_method, payment_status")
  .eq("id", req.params.id)
  .single();

if (fetchError) throw fetchError;

console.log("Existing Order:", existingOrder);

// Data to update
const updateData = {
  status,
};

console.log("Update Data Before:", updateData);

// If COD order is delivered, mark payment as Paid
if (
  status === "Delivered" &&
  existingOrder.payment_method === "cod"
) {
  updateData.payment_status = "Paid";
}

console.log("Update Data Before:", updateData);

const { data, error } = await supabase
  .from("orders")
  .update(updateData)
  .eq("id", req.params.id)
  .select()
  .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Order status updated successfully",
      order: data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;
