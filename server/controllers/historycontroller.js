const connect = require('../config/db');

const normalizePurchasedItems = (rawValue) => {
    if (rawValue == null) {
        return [];
    }

    const text = String(rawValue).trim();
    if (!text) {
        return [];
    }

    if (text.startsWith('[') && text.endsWith(']')) {
        try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
                return parsed
                    .map((item) => {
                        if (item && typeof item === 'object') {
                            const stockId = Number(item.stock_id);
                            const itemText = String(item.item || '').trim();
                            if (itemText.length === 0) {
                                return '';
                            }
                            if (Number.isInteger(stockId) && stockId > 0) {
                                return `#${stockId} - ${itemText}`;
                            }
                            return itemText;
                        }
                        return String(item || '').trim();
                    })
                    .filter((item) => item.length > 0);
            }
        } catch (err) {
            // fallback to line split format
        }
    }

    return text
        .split(/\r?\n|,/) 
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
};

const withPurchasedItemsList = (rows) => {
    return rows.map((row) => ({
        ...row,
        purchased_items_list: normalizePurchasedItems(row.purchased_items),
    }));
};

const getPurchasedItemsSelectExpr = (callback) => {
    connect.query('SHOW COLUMNS FROM order_history', (err, columns) => {
        if (err) {
            return callback(err);
        }

        const hasPurchasedItems = Array.isArray(columns)
            && columns.some((column) => column.Field === 'purchased_items');

        if (hasPurchasedItems) {
            return callback(null, 'oh.purchased_items');
        }

        return callback(null, 'NULL AS purchased_items');
    });
};

const queryHistoryRows = ({ userId, filterUserId }, callback) => {
    const hasUserFilter = Number.isInteger(filterUserId) && filterUserId > 0;

    getPurchasedItemsSelectExpr((schemaErr, purchasedItemsExpr) => {
        if (schemaErr) {
            return callback(schemaErr);
        }

        const query = `
            SELECT
                oh.id,
                oh.user_id,
                oh.product_id,
                oh.quantity,
                oh.unit_price,
                oh.total_price,
                ${purchasedItemsExpr},
                oh.status,
                oh.created_at,
                oh.updated_at,
                u.username,
                u.email,
                p.name AS product_name
            FROM order_history oh
            LEFT JOIN users u ON u.id = oh.user_id
            LEFT JOIN products p ON p.id = oh.product_id
            ${Number.isInteger(userId) ? 'WHERE oh.user_id = ?' : hasUserFilter ? 'WHERE oh.user_id = ?' : ''}
            ORDER BY oh.created_at DESC
        `;

        const params = Number.isInteger(userId)
            ? [userId]
            : hasUserFilter
                ? [filterUserId]
                : [];

        return connect.query(query, params, callback);
    });
};

exports.getPurchaseHistory = (req, res) => {
    const userId = req.user?.id || req.session?.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    queryHistoryRows({ userId: Number(userId) }, (err, results) => {
        if (err) {
            console.error('Error fetching purchase history:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        return res.json(withPurchasedItemsList(results));
    });
};

exports.getAllPurchaseHistory = (req, res) => {
    const filterUserId = Number(req.query.user_id);

    queryHistoryRows({ filterUserId }, (err, results) => {
        if (err) {
            console.error('Error fetching all purchase history:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        return res.json(withPurchasedItemsList(results));
    });
};
