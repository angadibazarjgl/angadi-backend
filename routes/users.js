const express = require("express");
const supabase = require("../config/supabase");
const auth = require("../middleware/auth");

const router = express.Router();

// Get Logged-in User Profile
router.get("/me", auth, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, mobile, email, created_at")
      .eq("id", req.user.id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      user
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;
