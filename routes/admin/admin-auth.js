const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../../config/database");

const router = express.Router();


// ==============================
// Admin Login Page
// ==============================
router.get("/admin/login", (req, res) => {

    // Display the admin login page
    res.render("admin/admin-login");
});


// ==============================
// Admin Login
// ==============================
router.post("/admin/login", (req, res) => {

    // Get login information from the form
    const { email, password } = req.body;

    // Check if both fields are filled in
    if (!email || !password) {
        return res.send("Please enter your email and password.");
    }

    // Find an admin account using the email
    db.query(
        "SELECT * FROM users WHERE email = ? AND role = 'admin'",
        [email],
        async (err, results) => {

            // Check for database errors
            if (err) {
                console.error(err);
                return res.send("Database error.");
            }

            // Check if the admin account exists
            if (results.length === 0) {
                return res.send("Invalid admin email or password.");
            }

            // Get the admin account
            const admin = results[0];

            // Compare the entered password with the hashed password
            const passwordMatch = await bcrypt.compare(
                password,
                admin.password
            );

            // Check if the password is incorrect
            if (!passwordMatch) {
                return res.send("Invalid admin email or password.");
            }

            // Store admin information in the session
            req.session.user = {
                id: admin.id,
                first_name: admin.first_name,
                last_name: admin.last_name,
                email: admin.email,
                role: admin.role
            };

            // Go to the admin dashboard after login
            res.redirect("/admin/dashboard");
        }
    );
});


// ==============================
// Admin Logout
// ==============================
router.get("/admin/logout", (req, res) => {

    // Destroy the current session
    req.session.destroy((err) => {

        // Check if there was a session error
        if (err) {
            console.error(err);
            return res.send("Logout failed.");
        }

        // Return to the admin login page
        res.redirect("/admin/login");
    });
});


// Export the admin authentication routes
module.exports = router;