// Import Express
const express = require("express");

// Import the MySQL database connection
const db = require("../../config/database");

// Create an Express router
const router = express.Router();


// Show the category management page
router.get("/admin/categories", (req, res) => {

    // Check if an admin is logged in
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.redirect("/admin/login");
    }

    // Get all categories
    db.query(
        "SELECT * FROM categories ORDER BY name ASC",
        (err, categories) => {

            if (err) {
                console.error(err);
                return res.send("Database error.");
            }

            res.render("admin/admin-categories", {
                categories: categories
            });
        }
    );
});


// Create a category
router.post("/admin/categories/create", (req, res) => {

    // Check if an admin is logged in
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(401).json({
            success: false,
            message: "Unauthorized."
        });
    }

    const { name } = req.body;

    // Check category name
    if (!name || !name.trim()) {
        return res.json({
            success: false,
            message: "Please enter a category name."
        });
    }

    const categoryName = name.trim();

    // Check for duplicate category
    db.query(
        "SELECT id FROM categories WHERE name = ?",
        [categoryName],
        (err, results) => {

            if (err) {
                console.error(err);

                return res.json({
                    success: false,
                    message: "Database error."
                });
            }

            if (results.length > 0) {
                return res.json({
                    success: false,
                    message: "Category already exists."
                });
            }

            // Insert category
            db.query(
                "INSERT INTO categories (name) VALUES (?)",
                [categoryName],
                (err, result) => {

                    if (err) {
                        console.error(err);

                        return res.json({
                            success: false,
                            message: "Failed to add category."
                        });
                    }

                    res.json({
                        success: true,
                        category: {
                            id: result.insertId,
                            name: categoryName
                        }
                    });
                }
            );
        }
    );
});


// Update a category
router.post("/admin/categories/edit/:id", (req, res) => {

    // Check if an admin is logged in
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.redirect("/admin/login");
    }

    const categoryId = req.params.id;
    const { name } = req.body;

    // Check category name
    if (!name || !name.trim()) {
        return res.send("Please enter a category name.");
    }

    const categoryName = name.trim();

    // Check if another category already uses the name
    db.query(
        "SELECT id FROM categories WHERE name = ? AND id != ?",
        [categoryName, categoryId],
        (err, results) => {

            if (err) {
                console.error(err);
                return res.send("Database error.");
            }

            if (results.length > 0) {
                return res.send("Category already exists.");
            }

            // Update category
            db.query(
                "UPDATE categories SET name = ? WHERE id = ?",
                [categoryName, categoryId],
                (err) => {

                    if (err) {
                        console.error(err);
                        return res.send("Failed to update category.");
                    }

                   res.redirect("/admin/products/create");
                }
            );
        }
    );
});


// Delete a category
router.post("/admin/categories/delete/:id", (req, res) => {

    // Check if an admin is logged in
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.redirect("/admin/login");
    }

    const categoryId = req.params.id;

    // Check if the category is being used by a product
    db.query(
        "SELECT id FROM products WHERE category_id = ? LIMIT 1",
        [categoryId],
        (err, products) => {

            if (err) {
                console.error(err);
                return res.send("Database error.");
            }

            // Do not delete a category that is being used
            if (products.length > 0) {
                return res.send(
                    "Cannot delete this category because it is being used by a shoe."
                );
            }

            // Delete category
            db.query(
                "DELETE FROM categories WHERE id = ?",
                [categoryId],
                (err) => {

                    if (err) {
                        console.error(err);
                        return res.send("Failed to delete category.");
                    }

                    res.redirect("/admin/products/create");
                }
            );
        }
    );
});


// Export the router
module.exports = router;