const express = require("express");
const db = require("../../config/database");

const router = express.Router();


// ========================================
// Add a shoe variant to the cart
// ========================================

router.post("/cart/add", (req, res) => {

    const { product_id, variant_id, quantity } = req.body;

    // Customer must be logged in
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const userId = req.session.user.id;
    const requestedQuantity = Number(quantity);

    // Check quantity
    if (!requestedQuantity || requestedQuantity < 1) {
        return res.send("Invalid quantity.");
    }

    // Get the selected shoe variant
    const sql = `
        SELECT
            product_variants.*,
            products.name
        FROM product_variants
        JOIN products
            ON product_variants.product_id = products.id
        WHERE product_variants.id = ?
        AND product_variants.product_id = ?
    `;

    db.query(
        sql,
        [variant_id, product_id],
        (err, results) => {

            if (err) {
                console.error(err);
                return res.send("Database error.");
            }

            if (results.length === 0) {
                return res.send("Shoe variant not found.");
            }

            const variant = results[0];

            // Make sure quantity does not exceed stock
            if (requestedQuantity > variant.stock) {
                return res.send("Quantity exceeds available stock.");
            }


            // Check if this variant is already in the cart
            db.query(
                `
                SELECT *
                FROM cart
                WHERE user_id = ?
                AND variant_id = ?
                `,
                [userId, variant_id],
                (err, results) => {

                    if (err) {
                        console.error(err);
                        return res.send("Database error.");
                    }


                    // ========================================
                    // Variant already exists in cart
                    // ========================================

                    if (results.length > 0) {

                        const newQuantity =
                            results[0].quantity + requestedQuantity;

                        // Do not allow quantity above stock
                        if (newQuantity > variant.stock) {
                            return res.send(
                                "Cart quantity exceeds available stock."
                            );
                        }

                        db.query(
                            `
                            UPDATE cart
                            SET quantity = ?
                            WHERE id = ?
                            `,
                            [
                                newQuantity,
                                results[0].id
                            ],
                            (err) => {

                                if (err) {
                                    console.error(err);
                                    return res.send("Database error.");
                                }

                                res.redirect("/cart");
                            }
                        );

                    } else {

                        // ========================================
                        // Add new item to cart
                        // ========================================

                        db.query(
                            `
                            INSERT INTO cart
                            (user_id, product_id, variant_id, quantity)
                            VALUES (?, ?, ?, ?)
                            `,
                            [
                                userId,
                                product_id,
                                variant_id,
                                requestedQuantity
                            ],
                            (err) => {

                                if (err) {
                                    console.error(err);
                                    return res.send("Database error.");
                                }

                                res.redirect("/cart");
                            }
                        );
                    }
                }
            );
        }
    );
});


// ========================================
// Increase or decrease cart quantity
// ========================================

router.post("/cart/update", (req, res) => {

    // Customer must be logged in
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const userId = req.session.user.id;
    const { cart_id, action } = req.body;


    // Get the cart item and current stock
    db.query(
        `
        SELECT
            cart.*,
            product_variants.stock
        FROM cart
        JOIN product_variants
            ON cart.variant_id = product_variants.id
        WHERE cart.id = ?
        AND cart.user_id = ?
        `,
        [cart_id, userId],
        (err, results) => {

            if (err) {
                console.error(err);
                return res.send("Database error.");
            }

            if (results.length === 0) {
                return res.send("Cart item not found.");
            }

            const cartItem = results[0];

            let newQuantity = cartItem.quantity;


            // Increase quantity
            if (action === "increase") {
                newQuantity++;
            }


            // Decrease quantity
            if (action === "decrease") {
                newQuantity--;
            }


            // Quantity cannot go below 1
            if (newQuantity < 1) {
                newQuantity = 1;
            }


            // Quantity cannot exceed stock
            if (newQuantity > cartItem.stock) {
                return res.send("Quantity exceeds available stock.");
            }


            // Update cart quantity
            db.query(
                `
                UPDATE cart
                SET quantity = ?
                WHERE id = ?
                AND user_id = ?
                `,
                [
                    newQuantity,
                    cart_id,
                    userId
                ],
                (err) => {

                    if (err) {
                        console.error(err);
                        return res.send("Database error.");
                    }

                    res.redirect("/cart");
                }
            );
        }
    );
});


// ========================================
// Remove item from cart
// ========================================

router.post("/cart/remove", (req, res) => {

    // Customer must be logged in
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const userId = req.session.user.id;
    const { cart_id } = req.body;


    db.query(
        `
        DELETE FROM cart
        WHERE id = ?
        AND user_id = ?
        `,
        [
            cart_id,
            userId
        ],
        (err) => {

            if (err) {
                console.error(err);
                return res.send("Database error.");
            }

            res.redirect("/cart");
        }
    );
});


// ========================================
// Show customer's cart
// ========================================

router.get("/cart", (req, res) => {

    // Customer must be logged in
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const userId = req.session.user.id;


    const sql = `
        SELECT
            cart.id,
            cart.quantity,

            products.name,
            products.image,

            product_variants.id AS variant_id,
            product_variants.color,
            product_variants.size,
            product_variants.price,
            product_variants.stock

        FROM cart

        JOIN products
            ON cart.product_id = products.id

        JOIN product_variants
            ON cart.variant_id = product_variants.id

        WHERE cart.user_id = ?

        ORDER BY cart.id DESC
    `;


    db.query(
        sql,
        [userId],
        (err, cartItems) => {

            if (err) {
                console.error(err);
                return res.send("Database error.");
            }

            const user = req.session.user || null;


            res.render("customer/cart", {
                cartItems: cartItems,
                user: user
            });
        }
    );
});


module.exports = router;