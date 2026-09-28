// Import Express
const express = require("express");

// Import the MySQL database connection
const db = require("../../config/database");

// Create an Express router
const router = express.Router();


// ==============================
// Show all shoes
// ==============================
router.get("/shoes", (req, res) => {

    // Get search and category from the URL
    const search = req.query.search || "";
    const category = req.query.category || "";

    // Start the SQL query
    let sql = `
        SELECT
            products.*,
            categories.name AS category_name
        FROM products
        JOIN categories
            ON products.category_id = categories.id
        WHERE products.name LIKE ?
    `;

    // Values for the SQL query
    const values = [`%${search}%`];

    // Add category filter if selected
    if (category) {
        sql += " AND categories.name = ?";
        values.push(category);
    }

    // Sort newest products first
    sql += " ORDER BY products.id DESC";

    // Run the query
    db.query(sql, values, (err, products) => {

        if (err) {
            console.error(err);
            return res.send("Database error.");
        }

        // Get the logged-in user from the session
        const user = req.session.user || null;

        // Display the products page
        res.render("customer/products", {
            products: products,
            search: search,
            category: category,
            user: user
        });
    });
});


// ==============================
// Show one shoe
// ==============================
router.get("/shoes/:id", (req, res) => {

    // Get the shoe ID from the URL
    const shoeId = req.params.id;

    // Get the shoe information
    const productSql = `
        SELECT
            products.*,
            categories.name AS category_name
        FROM products
        JOIN categories
            ON products.category_id = categories.id
        WHERE products.id = ?
    `;

    // Find the shoe
    db.query(productSql, [shoeId], (err, productResults) => {

        if (err) {
            console.error(err);
            return res.send("Database error.");
        }

        // Check if the shoe exists
        if (productResults.length === 0) {
            return res.send("Shoe not found.");
        }

        const product = productResults[0];

        // Get the color and size variants
        const variantSql = `
            SELECT *
            FROM product_variants
            WHERE product_id = ?
            ORDER BY id ASC
        `;

        // Find the variants
        db.query(variantSql, [shoeId], (err, variants) => {

            if (err) {
                console.error(err);
                return res.send("Database error.");
            }

            // Get the logged-in user
            const user = req.session.user || null;

            // Show the shoe details
            res.render("customer/product-details", {
                product: product,
                variants: variants,
                user: user
            });
        });
    });
});


// Export the router
module.exports = router;