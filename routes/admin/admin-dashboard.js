const express = require("express");
const db = require("../../config/database");

const router = express.Router();

router.get("/admin/dashboard", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.redirect("/admin/login");
    }

    db.query(
        "SELECT COUNT(*) AS totalProducts FROM products",
        (err, productResult) => {
            if (err) {
                console.error(err);
                return res.send("Database error.");
            }

            db.query(
                "SELECT COUNT(*) AS totalOrders FROM orders",
                (err, orderResult) => {
                    if (err) {
                        console.error(err);
                        return res.send("Database error.");
                    }

                    db.query(
                        `
                        SELECT
                            id,
                            name,
                            total,
                            status,
                            created_at
                        FROM orders
                        ORDER BY created_at DESC
                        LIMIT 5
                        `,
                        (err, recentOrders) => {
                            if (err) {
                                console.error(err);
                                return res.send("Database error.");
                            }

                            res.render("admin/admin-dashboard", {
                                totalProducts: productResult[0].totalProducts,
                                totalOrders: orderResult[0].totalOrders,
                                recentOrders: recentOrders
                            });
                        }
                    );
                }
            );
        }
    );
});

module.exports = router;