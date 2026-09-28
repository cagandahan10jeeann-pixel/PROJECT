const express = require("express");
const db = require("../../config/database");

const router = express.Router();

// Admin Orders
router.get("/admin/orders", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.redirect("/admin/login");
    }

    const sql = `
        SELECT
            orders.id,
            orders.name,
            orders.email,
            orders.total,
            orders.status,
            orders.created_at
        FROM orders
        ORDER BY orders.created_at DESC
    `;

    db.query(sql, (err, orders) => {
        if (err) {
            console.error(err);
            return res.send("Database error.");
        }

        res.render("admin/admin-orders", {
            orders: orders
        });
    });
});

// Admin Order Details
router.get("/admin/orders/:id", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.redirect("/admin/login");
    }

    const orderId = req.params.id;

    const orderSql = `
        SELECT
            orders.id,
            orders.name,
            orders.email,
            orders.delivery_address,
            orders.total,
            orders.status,
            orders.created_at
        FROM orders
        WHERE orders.id = ?
    `;

    db.query(orderSql, [orderId], (err, orderResults) => {
        if (err) {
            console.error(err);
            return res.send("Database error.");
        }

        if (orderResults.length === 0) {
            return res.send("Order not found.");
        }

        const order = orderResults[0];

        // Check the status received from MySQL
        console.log("Order status from database:", order.status);

        const itemsSql = `
            SELECT
                order_items.quantity,
                order_items.price,
                products.name,
                product_variants.color,
                product_variants.size
            FROM order_items
            JOIN products
                ON order_items.product_id = products.id
            JOIN product_variants
                ON order_items.variant_id = product_variants.id
            WHERE order_items.order_id = ?
        `;

        db.query(itemsSql, [orderId], (err, items) => {
            if (err) {
                console.error(err);
                return res.send("Database error.");
            }

            res.render("admin/admin-order-details", {
                order: order,
                items: items
            });
        });
    });
});

// Update Order Status
router.post("/admin/orders/:id/status", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.redirect("/admin/login");
    }

    const orderId = req.params.id;
    const { status } = req.body;

    // Show the received status in the terminal
    console.log("Updating order:", orderId);
    console.log("New status:", status);

    const allowedStatuses = [
        "Pending",
        "Processing",
        "Shipped",
        "Completed",
        "Cancelled"
    ];

    if (!allowedStatuses.includes(status)) {
        return res.send("Invalid order status.");
    }

    db.query(
        "UPDATE orders SET status = ? WHERE id = ?",
        [status, orderId],
        (err) => {
            if (err) {
                console.error(err);
                return res.send("Failed to update order status.");
            }

            res.redirect(`/admin/orders/${orderId}`);
        }
    );
});

module.exports = router;