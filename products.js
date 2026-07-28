const express = require("express");
const supabase = require("../config/supabase");

const router = express.Router();

/*
==========================================
GET ALL BANNERS
GET /api/banners
==========================================
*/
router.get("/banners", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      banners: data,
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
GET ALL CATEGORIES
GET /api/categories
==========================================
*/
router.get("/categories", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      categories: data,
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
GET ALL PRODUCTS
GET /api/products
==========================================
*/
router.get("/products", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
  *,
  categories(
    id,
    name,
    name_te
  ),
  product_variants(
    id,
    label,
    mrp,
    price,
    stock,
    sort_order
  )
`)
      .order("id", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      products: data,
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
GET PRODUCT DETAILS
GET /api/products/:id
==========================================
*/
router.get("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories(
          id,
          name,
          name_te
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      product: data,
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
GET PRODUCT VARIANTS
GET /api/products/:id/variants
==========================================
*/
router.get("/products/:id/variants", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", id)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      variants: data,
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
GET PRODUCTS BY CATEGORY
GET /api/products/category/:id
==========================================
*/
router.get("/products/category/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category_id", id)
      .order("id", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      products: data,
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
SEARCH PRODUCTS
GET /api/products/search?q=
==========================================
*/
router.get("/products/search", async (req, res) => {
  try {
    const q = req.query.q || "";

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .or(`name.ilike.%${q}%,name_te.ilike.%${q}%`)
      .order("id", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      products: data,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;