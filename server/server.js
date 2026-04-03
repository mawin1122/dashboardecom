const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const userRoutes = require('./routes/UserRoutes');
const ProductRoutes = require('./routes/ProductRoutes');
const CategoryRoutes = require('./routes/CategoryRoutes');
const StockRoutes = require('./routes/StockRoutes');
const BuyRoutes = require('./routes/BuyRoutes');
const historyRoutes = require('./routes/HistoryRoutes');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const app = express();
const port = 3001;

app.use(session({
  secret: "mysecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false
  }
}));
// Middleware
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

//Routes
app.use("/api/users", userRoutes)
app.use("/api/products", ProductRoutes)
app.use("/api/categories", CategoryRoutes)
app.use("/api/stock", StockRoutes)
app.use("/api/buy", BuyRoutes)
app.use("/api/history", historyRoutes)


// Ensure unknown API paths return JSON instead of Express default HTML.
app.use('/api', (req, res) => {
  return res.status(404).json({
    error: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


