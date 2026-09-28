// Import Express
const express = require("express");

// Import bcrypt for password hashing
const bcrypt = require("bcrypt");

// Import the MySQL database connection
const db = require("../../config/database");

// Create an Express router
const router = express.Router();


// ==============================
// Customer Registration Page
// ==============================

// Show the customer registration page
router.get("/register", (req, res) => {
    res.render("customer/register");
});


// ==============================
// Customer Login Page
// ==============================

// Show the customer login page
router.get("/login", (req, res) => {
    res.render("customer/login");
});


// ==============================
// Customer Registration
// ==============================

// Handle customer registration
router.post("/register", async (req, res) => {

    // Get the form values
    const {
        first_name,
        last_name,
        email,
        password,
        confirm_password
    } = req.body;

    // Check if all required fields were provided
    if (!first_name || !last_name || !email || !password || !confirm_password) {
        return res.send("Please fill in all fields.");
    }

    // Check if the password and confirmation match
    if (password !== confirm_password) {
        return res.send("Passwords do not match.");
    }

    // Check the password requirements
    const strongPassword =
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[!@#$%^&*]/.test(password);

    if (!strongPassword) {
        return res.send(
            "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character."
        );
    }

    // Check if the email already exists
    db.query(
        "SELECT id FROM users WHERE email = ?",
        [email],
        async (err, results) => {

            if (err) {
                console.error(err);
                return res.send("Database error.");
            }

            // Prevent duplicate email registration
            if (results.length > 0) {
                return res.send("Email is already registered.");
            }

            // Hash the password before saving it
            const hashedPassword = await bcrypt.hash(password, 10);

            // Save the customer in the database
            const sql = `
                INSERT INTO users
                (first_name, last_name, email, password, role)
                VALUES (?, ?, ?, ?, 'customer')
            `;

            db.query(
                sql,
                [first_name, last_name, email, hashedPassword],
                (err) => {

                    if (err) {
                        console.error(err);
                        return res.send("Registration failed.");
                    }

                    // Go to the home page after successful registration
                    res.redirect("/");
                }
            );
        }
    );
});


// ==============================
// Customer Login
// ==============================

// Handle customer login
router.post("/login", (req, res) => {

    // Get the login form values
    const { email, password } = req.body;

    // Check if both fields were provided
    if (!email || !password) {
        return res.send("Please enter your email and password.");
    }

    // Find the account by email
    db.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, results) => {

            if (err) {
                console.error(err);
                return res.send("Database error.");
            }

            // Check if the account exists
            if (results.length === 0) {
                return res.send("Invalid email or password.");
            }

            const user = results[0];

            // Only customers can use the customer login page
            if (user.role !== "customer") {
                return res.send("Please use the admin login page.");
            }

            // Check the entered password against the hashed password
            const passwordMatch = await bcrypt.compare(
                password,
                user.password
            );

            // Reject an incorrect password
            if (!passwordMatch) {
                return res.send("Invalid email or password.");
            }

            // Save the logged-in customer in the session
            req.session.user = {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role
            };

            // Go to the home page after successful login
            res.redirect("/");
        }
    );
});


// ==============================
// Customer Logout
// ==============================

// Handle customer logout
router.get("/logout", (req, res) => {

    // Destroy the current session
    req.session.destroy((err) => {

        if (err) {
            console.error(err);
            return res.send("Logout failed.");
        }

        // Go back to the login page
        res.redirect("/login");

    });

});


// Export the router
module.exports = router;