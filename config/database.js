// Load variables from the .env file
require("dotenv").config();

// Import MySQL
const mysql = require("mysql2");

// Create MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Test MySQL connection
db.connect((err) => {

    if (err) {
        console.error("MySQL connection failed:", err.message);
        return;
    }

    console.log("MySQL connected successfully!");
});

// Export database connection
module.exports = db;