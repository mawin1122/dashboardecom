const connect = require('../config/db');

exports.getPurchaseHistory = (req, res) => {
    const userId = req.user?.id || req.session?.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const query = `
        SELECT
            oh.*,
            u.username,
            u.email,
            p.name AS product_name
        FROM order_history oh
        LEFT JOIN users u ON u.id = oh.user_id
        LEFT JOIN products p ON p.id = oh.product_id
        WHERE oh.user_id = ?
        ORDER BY created_at DESC
    `;
    connect.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching purchase history:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        return res.json(results);
    });
};

exports.getAllPurchaseHistory = (req, res) => {
    const filterUserId = Number(req.query.user_id);
    const hasUserFilter = Number.isInteger(filterUserId) && filterUserId > 0;

    const query = `
        SELECT
            oh.*,
            u.username,
            u.email,
            p.name AS product_name
        FROM order_history oh
        LEFT JOIN users u ON u.id = oh.user_id
        LEFT JOIN products p ON p.id = oh.product_id
        ${hasUserFilter ? 'WHERE oh.user_id = ?' : ''}
        ORDER BY oh.created_at DESC
    `;
    const params = hasUserFilter ? [filterUserId] : [];

    connect.query(query, params, (err, results) => {
        if (err) {
            console.error('Error fetching all purchase history:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        return res.json(results);
    });
};
