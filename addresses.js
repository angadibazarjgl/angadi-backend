const express = require("express");
const supabase = require("../config/supabase");
const auth = require("../middleware/auth");

const router = express.Router();

/*
POST /api/addresses
Add Address
*/
router.post("/", auth, async (req, res) => {
  try {
    const { label, line1, line2, city, pincode, lat, lng } = req.body;

    if (!line1 || !city || !pincode) {
      return res.status(400).json({
        success: false,
        message: "line1, city and pincode are required",
      });
    }

    const { data: existing } = await supabase
      .from("addresses")
      .select("id")
      .eq("user_id", req.user.id);

    const isDefault = existing.length === 0;

    const { data, error } = await supabase
      .from("addresses")
      .insert([
        {
          user_id: req.user.id,
          label: label || "Home",
          line1,
          line2,
          city,
          pincode,
          lat,
          lng,
          is_default: isDefault,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      address: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/*
GET /api/addresses
Get User Addresses
*/
router.get("/", auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", req.user.id)
      .order("is_default", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      addresses: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/*
PUT /api/addresses/:id
Update Address
*/
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const { label, line1, line2, city, pincode, lat, lng } = req.body;

    const { data: address } = await supabase
      .from("addresses")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!address || address.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Address not found",
      });
    }

    const { data, error } = await supabase
      .from("addresses")
      .update({
        label,
        line1,
        line2,
        city,
        pincode,
        lat,
        lng,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Address updated",
      address: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/*
DELETE /api/addresses/:id
*/
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: address } = await supabase
      .from("addresses")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!address || address.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Address not found",
      });
    }

    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({
      success: true,
      message: "Address deleted",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/*
PATCH /api/addresses/:id/default
*/
router.patch("/:id/default", auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Remove default from all addresses
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", req.user.id);

    // Set selected address as default
    const { data, error } = await supabase
      .from("addresses")
      .update({ is_default: true })
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Default address updated",
      address: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;