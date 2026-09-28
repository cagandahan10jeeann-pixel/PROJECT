// Load variables from the .env file
require("dotenv").config();

// Import the Express framework
const express = require("express");
// Import the session package
const session = require("express-session");


// Import the MySQL database connection
require("./config/database");

// Import customer authentication routes
const customerAuthRoutes = require("./routes/customer/auth");

// Import customer home routes
const customerHomeRoutes = require("./routes/customer/home");

// Import customer product routes
const customerProductRoutes = require("./routes/customer/products");

// Import customer cart routes
const customerCartRoutes = require("./routes/customer/cart");

// Import customer checkout routes
const customerCheckoutRoutes = require("./routes/customer/checkout");

// Import customer orders routes
const customerOrdersRoutes = require("./routes/customer/orders");

// Customer Profile Routes
const customerProfileRoutes = require("./routes/customer/profile");



// Import admin authentication routes
const adminAuthRoutes = require("./routes/admin/admin-auth");

// Import admin dashboard routes
const adminDashboardRoutes = require("./routes/admin/admin-dashboard");

// Import admin products routes
const adminProductsRoutes = require("./routes/admin/admin-products");

// Import admin categories routes
const adminCategoriesRoutes = require("./routes/admin/admin-categories");

// Import admin orders routes
const adminOrdersRoutes = require("./routes/admin/admin-orders");

// Import admin profile routes
const adminProfileRoutes = require("./routes/admin/admin-profile");


// Create an Express application
const app = express();

// Set EJS as the template engine
app.set("view engine", "ejs");

// Allow the server to receive form data
app.use(express.urlencoded({ extended: true }));

// Allow the server to receive JSON data
app.use(express.json());

/// Configure user sessions
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Serve files from the public folder
app.use(express.static("public"));


// Use customer authentication routes
app.use("/", customerAuthRoutes);

// Use customer home routes
app.use("/", customerHomeRoutes);

// Use customer product routes
app.use("/", customerProductRoutes);

// Use customer cart routes
app.use("/", customerCartRoutes);

// Use customer checkout routes
app.use("/", customerCheckoutRoutes);

// Use customer orders routes
app.use("/", customerOrdersRoutes);

// Customer Profile
app.use("/", customerProfileRoutes);



// Use admin authentication routes
app.use("/", adminAuthRoutes);

// Use admin dashboard routes
app.use("/", adminDashboardRoutes);

// Use admin products routes
app.use("/", adminProductsRoutes);

// Use admin categories routes
app.use("/", adminCategoriesRoutes);

// Use admin orders routes
app.use("/", adminOrdersRoutes);

// Use admin profile routes
app.use("/", adminProfileRoutes);


// Start the server
app.listen(3000, () => {
    console.log("ShoeHub is running on http://localhost:3000");
});