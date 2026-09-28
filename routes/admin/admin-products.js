// Import Express
const express = require("express");

// Import the MySQL database connection
const db = require("../../config/database");

// Create an Express router
const router = express.Router();


// Show the add shoe page
router.get("/admin/products/create", (req, res) => {

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

            res.render("admin/admin-products-create", {
                categories: categories
            });
        }
    );
});

// Save a new shoe

router.post("/admin/products/create", (req, res) => {

    // Check if an admin is logged in
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.redirect("/admin/login");
    }

    // Get the form values
    const {
        name,
        category_id,
        price,
        stock,
        color,
        size,
        description
    } = req.body;

    // Check required fields
    if (!name || !category_id || !price || !stock || !color || !size) {
        return res.send("Please fill in all required fields.");
    }

    // Create the shoe
    const productSql = `
        INSERT INTO products
        (name, category_id, price, stock, color, size, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        productSql,
        [
            name,
            category_id,
            price,
            stock,
            color,
            size,
            description
        ],
        (err, result) => {

            // Check if the shoe was created
            if (err) {
                console.error(err);
                return res.send("Failed to add shoe.");
            }

            // Get the new shoe ID
            const productId = result.insertId;

            // Create the first variant
            const variantSql = `
                INSERT INTO product_variants
                (product_id, price, stock, color, size)
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(
                variantSql,
                [
                    productId,
                    price,
                    stock,
                    color,
                    size
                ],
                (err) => {

                    // Check if the variant was created
                    if (err) {
                        console.error(err);
                        return res.send(
                            "Shoe was added but variant creation failed."
                        );
                    }

                    // Return to the Products page
                    res.redirect("/admin/products");

                }
            );
        }
    );
});

// ========================================
// Show all products
// ========================================

router.get("/admin/products", (req, res) => {

    // Check if an admin is logged in
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.redirect("/admin/login");
    }

    // Get the selected category from the URL
    // Example: /admin/products?category=Sneakers
    const category = req.query.category || "";

    // Start the products query
    let sql = `
        SELECT
            product_variants.id AS variant_id,
            products.id AS product_id,
            products.name,
            products.image,
            categories.name AS category_name,
            product_variants.price,
            product_variants.stock,
            product_variants.color,
            product_variants.size

        FROM product_variants

        JOIN products
            ON product_variants.product_id = products.id

        JOIN categories
            ON products.category_id = categories.id
    `;

    // Store values for the SQL query
    const values = [];

    // Filter by category if one was selected
    if (category) {

        sql += `
            WHERE categories.name = ?
        `;

        values.push(category);
    }

    // Sort products
    sql += `
        ORDER BY products.id DESC, product_variants.id ASC
    `;


    // Get the products
    db.query(sql, values, (err, products) => {

        // Check for database errors
        if (err) {
            console.error(err);
            return res.send("Database error.");
        }


        // Get all categories for the filter dropdown
        db.query(
            "SELECT * FROM categories ORDER BY name ASC",
            (err, categories) => {

                // Check for database errors
                if (err) {
                    console.error(err);
                    return res.send("Database error.");
                }


                // Send the products and categories
                // to the Products page
                res.render("admin/admin-products", {
                    products: products,
                    categories: categories,
                    category: category
                });

            }
        );

    });

});


// Show edit shoe variant page

router.get("/admin/products/edit/:id", (req, res) => {

    // Check if an admin is logged in
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.redirect("/admin/login");
    }

    // The ID from the URL is the variant ID
    const variantId = req.params.id;

    // Get the selected variant together with its shoe
    const sql = `
        SELECT
            product_variants.id AS variant_id,
            product_variants.product_id,
            product_variants.price AS variant_price,
            product_variants.stock AS variant_stock,
            product_variants.color AS variant_color,
            product_variants.size AS variant_size,

            products.name,
            products.category_id,
            products.description,
            products.image

        FROM product_variants

        JOIN products
            ON product_variants.product_id = products.id

        WHERE product_variants.id = ?
    `;

    db.query(sql, [variantId], (err, results) => {

        // Check for database errors
        if (err) {
            console.error(err);
            return res.send("Database error.");
        }

        // Check if the variant exists
        if (results.length === 0) {
            return res.send("Shoe variant not found.");
        }

        const product = results[0];

        // Get all categories
        db.query(
            "SELECT * FROM categories ORDER BY name ASC",
            (err, categories) => {

                // Check for database errors
                if (err) {
                    console.error(err);
                    return res.send("Database error.");
                }

                // Show the edit page
                res.render("admin/admin-products-edit", {
                    product: product,
                    categories: categories
                });

            }
        );

    });

});

// Save edited shoe variant
router.post("/admin/products/edit/:id", (req, res) => {

    // Check if an admin is logged in
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.redirect("/admin/login");
    }

    // Get the variant ID from the URL
    const variantId = req.params.id;

    // Get the form values
    const {
        name,
        category_id,
        price,
        stock,
        color,
        size,
        description
    } = req.body;

    // Check required fields
    if (
        !name ||
        !category_id ||
        price === "" ||
        stock === "" ||
        !color ||
        !size
    ) {
        return res.send("Please fill in all required fields.");
    }

    // Convert price and stock to numbers
    const numericPrice = Number(price);
    const numericStock = Number(stock);

    // Check if price and stock are valid
    if (
        Number.isNaN(numericPrice) ||
        Number.isNaN(numericStock) ||
        numericPrice < 0 ||
        numericStock < 0
    ) {
        return res.send("Invalid price or stock.");
    }

    // First get the product ID of this variant
    db.query(
        "SELECT product_id FROM product_variants WHERE id = ?",
        [variantId],
        (err, results) => {

            if (err) {
                console.error(err);
                return res.send("Database error.");
            }

            // Check if the variant exists
            if (results.length === 0) {
                return res.send("Shoe variant not found.");
            }

            const productId = results[0].product_id;

            // Update the shoe information
            const productSql = `
                UPDATE products
                SET
                    name = ?,
                    category_id = ?,
                    description = ?
                WHERE id = ?
            `;

            db.query(
                productSql,
                [
                    name,
                    category_id,
                    description || "",
                    productId
                ],
                (err) => {

                    if (err) {
                        console.error(err);
                        return res.send("Failed to update shoe.");
                    }

                    // Update the selected variant
                    const variantSql = `
                        UPDATE product_variants
                        SET
                            price = ?,
                            stock = ?,
                            color = ?,
                            size = ?
                        WHERE id = ?
                    `;

                    db.query(
                        variantSql,
                        [
                            numericPrice,
                            numericStock,
                            color,
                            size,
                            variantId
                        ],
                        (err) => {

                            if (err) {
                                console.error(err);

                                // Handle duplicate color and size
                                if (err.code === "ER_DUP_ENTRY") {
                                    return res.send(
                                        "A variant with this color and size already exists for this shoe."
                                    );
                                }

                                return res.send(
                                    "Failed to update shoe variant."
                                );
                            }

                            // Return to Products page
                            res.redirect("/admin/products");

                        }
                    );

                }
            );

        }
    );

});

// Delete a whole shoe
router.post("/admin/products/delete/:id", (req, res) => {

    // Check if an admin is logged in
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.redirect("/admin/login");
    }

    // The ID from the URL is the variant ID
    const variantId = req.params.id;

    // First get the product ID of this variant
    db.query(
        "SELECT product_id FROM product_variants WHERE id = ?",
        [variantId],
        (err, results) => {

            // Check for database errors
            if (err) {
                console.error(err);
                return res.send("Database error.");
            }

            // Check if the variant exists
            if (results.length === 0) {
                return res.send("Shoe variant not found.");
            }

            const productId = results[0].product_id;

            // Check if any variant of this shoe is already in an order
            db.query(
                `
                SELECT id
                FROM order_items
                WHERE product_id = ?
                LIMIT 1
                `,
                [productId],
                (err, orderItems) => {

                    // Check for database errors
                    if (err) {
                        console.error(err);
                        return res.send("Database error.");
                    }

                    // Do not delete a shoe that already has an order
                    if (orderItems.length > 0) {
                        return res.send(
                            "Cannot delete this shoe because it is already included in an order."
                        );
                    }

                    // Delete all variants of the shoe
                    db.query(
                        "DELETE FROM product_variants WHERE product_id = ?",
                        [productId],
                        (err) => {

                            // Check for database errors
                            if (err) {
                                console.error(err);
                                return res.send(
                                    "Failed to delete shoe variants."
                                );
                            }

                            // Delete the actual shoe
                            db.query(
                                "DELETE FROM products WHERE id = ?",
                                [productId],
                                (err) => {

                                    // Check for database errors
                                    if (err) {
                                        console.error(err);
                                        return res.send(
                                            "Failed to delete shoe."
                                        );
                                    }

                                    // Return to Products page
                                    res.redirect("/admin/products");
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});


module.exports = router;    