const mysql = require("mysql");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });



const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME
});

if (!process.env.DB_USER || !process.env.DB_NAME) {
    console.error('Missing database configuration. Set DB_USER and DB_NAME in the root .env file.');
    process.exit(1);
}

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});
module.exports = connection;