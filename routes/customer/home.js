const express = require("express");

const router = express.Router();

// ==============================
// Customer Home Page
// ==============================
router.get("/", (req, res) => {

    // Get the logged-in user from the session
    const user = req.session.user || null;

    // Display the home page
    res.render("customer/home", {
        user: user
    });

});

module.exports = router;