const express = require("express");
const db = require("../../config/database");

const router = express.Router();

// ==============================
// Customer Profile Page
// ==============================
router.get("/profile", (req, res) => {

    // Check if customer is logged in
    if (!req.session.user) {
        return res.redirect("/login");
    }

    // Get the logged-in customer's ID
    const userId = req.session.user.id;

    // Get customer information from database
    db.query(
        `
        SELECT
            id,
            first_name,
            last_name,
            email,
            role
        FROM users
        WHERE id = ?
        `,
        [userId],
        (err, results) => {

            // Check for database errors
            if (err) {
                console.error(err);
                return res.send("Database error.");
            }

            // Check if customer exists
            if (results.length === 0) {
                return res.send("Profile not found.");
            }

            // Display customer profile
            res.render("customer/profile", {
                user: results[0]
            });
        }
    );
});


// ==============================
// Edit Profile Page
// ==============================
router.get("/profile/edit", (req, res) => {

    // Check if customer is logged in
    if (!req.session.user) {
        return res.redirect("/login");
    }

    // Get the logged-in customer's ID
    const userId = req.session.user.id;

    // Get customer information from database
    db.query(
        `
        SELECT
            id,
            first_name,
            last_name,
            email,
            role
        FROM users
        WHERE id = ?
        `,
        [userId],
        (err, results) => {

            // Check for database errors
            if (err) {
                console.error(err);
                return res.send("Database error.");
            }

            // Check if customer exists
            if (results.length === 0) {
                return res.send("Profile not found.");
            }

            // Display edit profile page
            res.render("customer/profile-edit", {
                user: results[0]
            });
        }
    );
});

// ==============================
// Save Edited Profile
// ==============================
router.post("/profile/edit", (req, res) => {

    // Check if customer is logged in
    if (!req.session.user) {
        return res.redirect("/login");
    }

    // Get the logged-in customer's ID
    const userId = req.session.user.id;

    // Get updated information from the form
    const {
        first_name,
        last_name,
        email
    } = req.body;

    // Check if all fields are filled in
    if (!first_name || !last_name || !email) {
        return res.send("Please fill in all fields.");
    }

    // Check if another user already uses this email
    db.query(
        `
        SELECT id
        FROM users
        WHERE email = ? AND id != ?
        `,
        [email, userId],
        (err, results) => {

            // Check for database errors
            if (err) {
                console.error(err);
                return res.send("Database error.");
            }

            // Prevent duplicate email
            if (results.length > 0) {
                return res.send("Email is already being used.");
            }

            // Update customer information
            db.query(
                `
                UPDATE users
                SET first_name = ?,
                    last_name = ?,
                    email = ?
                WHERE id = ?
                `,
                [
                    first_name,
                    last_name,
                    email,
                    userId
                ],
                (err) => {

                    // Check for database errors
                    if (err) {
                        console.error(err);
                        return res.send("Failed to update profile.");
                    }

                    // Update the session information
                    req.session.user.first_name = first_name;
                    req.session.user.last_name = last_name;
                    req.session.user.email = email;

                    // Return to the profile page
                    res.redirect("/profile");
                }
            );
        }
    );
});


// Export customer profile routes
module.exports = router;