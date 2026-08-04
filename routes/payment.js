const express = require("express");
const razorpay = require("../config/razorpay");
const authenticate = require("../middleware/auth");

const router = express.Router();

/*
==========================================
CREATE RAZORPAY ORDER
POST /api/payment/create-order
==========================================
*/

router.post("/create-order", authenticate, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;
