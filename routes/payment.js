const express = require("express");
const razorpay = require("../config/razorpay");
const authenticate = require("../middleware/auth");
const crypto = require("crypto");

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
      amount: Math.round(amount * 100),
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
});   // ✅ CLOSE create-order route here

/*
==========================================
VERIFY RAZORPAY PAYMENT
POST /api/payment/verify
==========================================
*/

router.post("/verify", authenticate, async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment details",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    return res.json({
      success: true,
      message: "Payment verified successfully",
    });

  } catch (err) {
    console.error("VERIFY PAYMENT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;
