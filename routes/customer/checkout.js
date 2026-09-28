// Import Express
const express = require("express");

// Import MySQL database connection
const db = require("../../config/database");

// Create router
const router = express.Router();


// ========================================
// Show Checkout Page
// ========================================

router.get("/checkout", (req, res) => {

    // Customer must be logged in
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const userId = req.session.user.id;

    // Get the customer's cart
    const sql = `
        SELECT
            cart.quantity,
            products.name,
            products.image,
            product_variants.price,
            product_variants.color,
            product_variants.size,
            product_variants.stock

        FROM cart

        JOIN products
            ON cart.product_id = products.id

        JOIN product_variants
            ON cart.variant_id = product_variants.id

        WHERE cart.user_id = ?
    `;

    db.query(sql, [userId], (err, cartItems) => {

        if (err) {
            console.error(err);
            return res.send("Database error.");
        }

        // Do not allow checkout with an empty cart
        if (cartItems.length === 0) {
            return res.send("Your cart is empty.");
        }

        // Calculate total
        let total = 0;

        cartItems.forEach(item => {
            total += Number(item.price) * Number(item.quantity);
        });

        const user = req.session.user || null;

        // Show checkout page
        res.render("customer/checkout", {
            cartItems: cartItems,
            total: total,
            user: user
        });
    });
});


// ========================================
// Place Order
// ========================================

router.post("/checkout", (req, res) => {

    // Customer must be logged in
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const userId = req.session.user.id;

    // Get checkout form information
    const {
        name,
        email,
        address
    } = req.body;

    // Check required fields
    if (!name || !email || !address) {
        return res.send("Please fill in all checkout fields.");
    }


    // ========================================
    // Get Cart Items
    // ========================================

    const cartSql = `
        SELECT
            cart.id,
            cart.product_id,
            cart.variant_id,
            cart.quantity,

            products.name,

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
    `;

    db.query(cartSql, [userId], (err, cartItems) => {

        if (err) {
            console.error(err);
            return res.send("Database error.");
        }

        // Cart must contain items
        if (cartItems.length === 0) {
            return res.send("Your cart is empty.");
        }


        // ========================================
        // Check Stock Before Creating Order
        // ========================================

        for (const item of cartItems) {

            if (item.quantity > item.stock) {

                return res.send(
                    `${item.name} (${item.color}, Size ${item.size}) does not have enough stock.`
                );
            }
        }


        // ========================================
        // Calculate Order Total
        // ========================================

        let total = 0;

        cartItems.forEach(item => {
            total += Number(item.price) * Number(item.quantity);
        });


        // ========================================
        // Create Order
        // ========================================

        const orderSql = `
            INSERT INTO orders
            (user_id, name, email, delivery_address, total)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
            orderSql,
            [
                userId,
                name,
                email,
                address,
                total
            ],
            (err, orderResult) => {

                if (err) {
                    console.error(err);
                    return res.send("Failed to create order.");
                }

                const orderId = orderResult.insertId;


                // ========================================
                // Save Order Items
                // ========================================

                let completedItems = 0;

                cartItems.forEach(item => {

                    const itemSql = `
                        INSERT INTO order_items
                        (order_id, product_id, variant_id, quantity, price)
                        VALUES (?, ?, ?, ?, ?)
                    `;

                    db.query(
                        itemSql,
                        [
                            orderId,
                            item.product_id,
                            item.variant_id,
                            item.quantity,
                            item.price
                        ],
                        (err) => {

                            if (err) {
                                console.error(err);
                                return res.send(
                                    "Failed to save order items."
                                );
                            }

                            completedItems++;

                            // Wait until every order item is saved
                            if (
                                completedItems ===
                                cartItems.length
                            ) {

                                // ========================================
                                // Reduce Variant Stock
                                // ========================================

                                let completedStockUpdates = 0;

                                cartItems.forEach(item => {

                                    const stockSql = `
                                        UPDATE product_variants
                                        SET stock = stock - ?
                                        WHERE id = ?
                                    `;

                                    db.query(
                                        stockSql,
                                        [
                                            item.quantity,
                                            item.variant_id
                                        ],
                                        (err) => {

                                            if (err) {
                                                console.error(err);
                                                return res.send(
                                                    "Failed to update stock."
                                                );
                                            }

                                            completedStockUpdates++;

                                            // Wait until all stock
                                            // updates are complete
                                            if (
                                                completedStockUpdates ===
                                                cartItems.length
                                            ) {

                                                // ========================================
                                                // Clear Cart
                                                // ========================================

                                                db.query(
                                                    `
                                                    DELETE FROM cart
                                                    WHERE user_id = ?
                                                    `,
                                                    [userId],
                                                    (err) => {

                                                        if (err) {
                                                            console.error(err);
                                                            return res.send(
                                                                "Failed to clear cart."
                                                            );
                                                        }


                                                        // ========================================
                                                        // Order Success
                                                        // ========================================

                                                        // Display the success card
                                                        res.send(`
                                                            <!DOCTYPE html>

                                                            <html lang="en">

                                                            <head>

                                                                <meta charset="UTF-8">

                                                                <meta
                                                                    name="viewport"
                                                                    content="width=device-width, initial-scale=1.0"
                                                                >

                                                                <!-- Tailwind CSS -->
                                                                <script src="https://cdn.tailwindcss.com"></script>

                                                                <title>
                                                                    Order Successful - ShoeHub
                                                                </title>

                                                            </head>


                                                            <body class="bg-stone-100 min-h-screen">


                                                                <!-- ========================================
                                                                     Navbar
                                                                ========================================= -->

                                                                <nav class="bg-stone-900 text-white px-6 py-4">

                                                                    <div class="max-w-6xl mx-auto flex items-center justify-between">

                                                                        <!-- ShoeHub Logo -->
                                                                        <a
                                                                            href="/"
                                                                            class="text-xl font-bold"
                                                                        >
                                                                            👟 SHOEHUB
                                                                        </a>


                                                                        <!-- Navigation Links -->
                                                                        <div class="flex items-center gap-6">

                                                                            <a
                                                                                href="/"
                                                                                class="hover:text-stone-300"
                                                                            >
                                                                                Home
                                                                            </a>

                                                                            <a
                                                                                href="/shoes"
                                                                                class="hover:text-stone-300"
                                                                            >
                                                                                Shoes
                                                                            </a>

                                                                            <a
                                                                                href="/cart"
                                                                                class="hover:text-stone-300"
                                                                            >
                                                                                Cart
                                                                            </a>

                                                                            <a
                                                                                href="/orders"
                                                                                class="hover:text-stone-300"
                                                                            >
                                                                                My Orders
                                                                            </a>

                                                                        </div>

                                                                    </div>

                                                                </nav>


                                                                <!-- ========================================
                                                                     Success Card
                                                                ========================================= -->

                                                                <div class="min-h-[80vh] flex items-center justify-center px-6">

                                                                    <div class="bg-white rounded-2xl shadow-xl border border-stone-200 p-8 max-w-md w-full text-center">


                                                                        <!-- Success Icon -->
                                                                        <div class="w-16 h-16 mx-auto mb-5 bg-green-100 rounded-full flex items-center justify-center">

                                                                            <span class="text-3xl text-green-600">
                                                                                ✓
                                                                            </span>

                                                                        </div>


                                                                        <!-- Success Title -->
                                                                        <h1 class="text-2xl font-bold text-stone-900 mb-3">

                                                                            Order Placed Successfully!

                                                                        </h1>


                                                                        <!-- Order Number -->
                                                                        <p class="text-stone-600 mb-6">

                                                                            Your Order

                                                                            <span class="font-bold text-stone-900">
                                                                                #${orderId}
                                                                            </span>

                                                                            has been placed successfully.

                                                                        </p>


                                                                        <!-- View Orders Button -->
                                                                        <a
                                                                            href="/orders"
                                                                            class="inline-block bg-stone-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-stone-700"
                                                                        >
                                                                            View My Orders
                                                                        </a>


                                                                        <!-- Continue Shopping -->
                                                                        <a
                                                                            href="/shoes"
                                                                            class="block mt-4 text-stone-600 hover:text-stone-900"
                                                                        >
                                                                            Continue Shopping
                                                                        </a>

                                                                    </div>

                                                                </div>

                                                            </body>

                                                            </html>
                                                        `);

                                                    }
                                                );
                                            }
                                        }
                                    );
                                });
                            }
                        }
                    );
                });
            }
        );
    });
});


// ========================================
// Export Router
// ========================================

module.exports = router;