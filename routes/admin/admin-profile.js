const express = require("express");
const db = require("../../config/database");

const router = express.Router();


// ==============================
// Admin Profile Page
// ==============================
router.get("/admin/profile", (req, res) => {

    // Check if the user is logged in as an admin
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.redirect("/admin/login");
    }

    // Get the logged-in admin ID
    const adminId = req.session.user.id;

    // Get admin information from the database
    db.query(
        `
        SELECT
            id,
            first_name,
            last_name,
            email,
            role
        FROM users
        WHERE id = ? AND role = 'admin'
        `,
        [adminId],
        (err, results) => {

            // Check for database errors
            if (err) {
                console.error(err);
                return res.send("Database error.");
            }

            // Check if the admin account exists
            if (results.length === 0) {
                return res.send("Admin profile not found.");
            }

            // Display the admin profile page
            res.render("admin/admin-profile", {
                admin: results[0]
            });
        }
    );
});


// ==============================
// Edit Admin Profile Page
// ==============================
router.get("/admin/profile/edit", (req, res) => {

    // Check if the user is logged in as an admin
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.redirect("/admin/login");
    }

    // Get the logged-in admin ID
    const adminId = req.session.user.id;

    // Get admin information
    db.query(
        `
        SELECT
            id,
            first_name,
            last_name,
            email,
            role
        FROM users
        WHERE id = ? AND role = 'admin'
        `,
        [adminId],
        (err, results) => {

            // Check for database errors
            if (err) {
                console.error(err);
                return res.send("Database error.");
            }

            // Check if the admin exists
            if (results.length === 0) {
                return res.send("Admin profile not found.");
            }

            // Display the edit profile page
            res.render("admin/admin-profile-edit", {
                admin: results[0]
            });
        }
    );
});


// ==============================
// Update Admin Profile
// ==============================
router.post("/admin/profile/edit", (req, res) => {

    // Check if the user is logged in as an admin
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.redirect("/admin/login");
    }

    // Get the logged-in admin ID
    const adminId = req.session.user.id;

    // Get information from the form
    const {
        first_name,
        last_name,
        email
    } = req.body;

    // Make sure all fields are filled in
    if (!first_name || !last_name || !email) {
        return res.send("Please fill in all fields.");
    }

    // Check if another account already uses the email
    db.query(
        `
        SELECT id
        FROM users
        WHERE email = ? AND id != ?
        `,
        [email, adminId],
        (err, results) => {

            // Check for database errors
            if (err) {
                console.error(err);
                return res.send("Database error.");
            }

            // Prevent duplicate email addresses
            if (results.length > 0) {
                return res.send("Email is already being used.");
            }

            // Update admin information
            db.query(
                `
                UPDATE users
                SET first_name = ?,
                    last_name = ?,
                    email = ?
                WHERE id = ? AND role = 'admin'
                `,
                [
                    first_name,
                    last_name,
                    email,
                    adminId
                ],
                (err) => {

                    // Check for database errors
                    if (err) {
                        console.error(err);
                        return res.send("Failed to update profile.");
                    }

                    // Update session information
                    req.session.user.first_name = first_name;
                    req.session.user.last_name = last_name;
                    req.session.user.email = email;

                    // Return to the profile page
                    res.redirect("/admin/profile");
                }
            );
        }
    );
});


// Export admin profile routes
module.exports = router;