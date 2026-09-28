// Import Express
const express = require("express");

// Import the MySQL database connection
const db = require("../../config/database");

// Create an Express router
const router = express.Router();


// ==============================
// Show Customer Orders
// ==============================
router.get("/orders", (req, res) => {

    // Check if the customer is logged in
    if (!req.session.user) {
        return res.redirect("/login");
    }

    // Get the logged-in user's ID
    const userId = req.session.user.id;

    // Get the logged-in user
    const user = req.session.user;

    // Get the customer's orders
    const sql = `
        SELECT
            id,
            total,
            status,
            created_at
        FROM orders
        WHERE user_id = ?
        ORDER BY id DESC
    `;

    db.query(sql, [userId], (err, orders) => {

        if (err) {
            console.error(err);
            return res.send("Database error.");
        }

        // Display the orders page
        res.render("customer/orders", {
            orders: orders,
            user: user
        });

    });

});


// Export the router
module.exports = router;