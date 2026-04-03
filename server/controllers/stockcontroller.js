const connection = require('../config/db');

const getProductSchema = (callback) => {
    connection.query('SHOW COLUMNS FROM products', (err, columns) => {
        if (err) {
            return callback(err);
        }

        const names = new Set(columns.map((column) => column.Field));
        return callback(null, {
            hasStock: names.has('stock'),
        });
    });
};

exports.getStock = (req, res) => {
    const query = 'SELECT * FROM stock ORDER BY id DESC';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching stock:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        return res.json(results);
    });
};

exports.getStockByProduct = (req, res) => {
    const productId = req.params.productId;
    const query = 'SELECT * FROM stock WHERE product_id = ? ORDER BY id DESC';

    connection.query(query, [productId], (err, results) => {
        if (err) {
            console.error('Error fetching stock by product:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        return res.json(results);
    });
};




exports.addStock = (req, res) => {
    const { product_id, items } = req.body;

    if (!product_id) {
        return res.status(400).json({ error: 'product_id is required' });
    }

    if (!Array.isArray(items)) {
        return res.status(400).json({
            error: 'items must be an array, for example: ["test1", "test2"]',
        });
    }

    const checkProductQuery = 'SELECT * FROM products WHERE id = ?';
    connection.query(checkProductQuery, [product_id], (productErr, productResults) => {
        if (productErr) {
            console.error('Error checking product:', productErr);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (productResults.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        return getProductSchema((schemaErr, schema) => {
            if (schemaErr) {
                console.error('Error reading products schema:', schemaErr);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            return insertStock(product_id, items, schema, res);
        });
    });
};

const insertStock = (productId, items, schema, res) => {
    const normalizedItems = items
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0);

    if (normalizedItems.length === 0) {
        return res.status(400).json({ error: 'items must contain at least one value' });
    }

    const insertQuery = 'INSERT INTO stock (product_id, items) VALUES ?';
    const values = normalizedItems.map((item) => [productId, item]);

    connection.beginTransaction((transactionErr) => {
        if (transactionErr) {
            console.error('Error starting stock transaction:', transactionErr);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        connection.query(insertQuery, [values], (insertErr, result) => {
            if (insertErr) {
                return connection.rollback(() => {
                    console.error('Error adding stock:', insertErr);
                    return res.status(500).json({ error: 'Internal Server Error' });
                });
            }

            const completeTransaction = (extra = {}) => {
                return connection.commit((commitErr) => {
                    if (commitErr) {
                        return connection.rollback(() => {
                            console.error('Error committing stock transaction:', commitErr);
                            return res.status(500).json({ error: 'Internal Server Error' });
                        });
                    }

                    return res.json({
                        message: 'Stock added successfully',
                        inserted: result.affectedRows,
                        ...extra,
                    });
                });
            };

            if (!schema.hasStock) {
                return completeTransaction({ stockColumnUpdated: false });
            }

            const updateProductStockQuery = 'UPDATE products SET stock = COALESCE(stock, 0) + ? WHERE id = ?';
            connection.query(updateProductStockQuery, [normalizedItems.length, productId], (updateErr) => {
                if (updateErr) {
                    return connection.rollback(() => {
                        console.error('Error updating product stock:', updateErr);
                        return res.status(500).json({ error: 'Internal Server Error' });
                    });
                }

                return completeTransaction({ stockColumnUpdated: true });
            });
        });
    });
};

exports.updateStockByid = (req, res) => {
    const stockId = req.params.id;
    const { items } = req.body;

    if (!Array.isArray(items)) {
        return res.status(400).json({
            error: 'items must be an array, for example: ["test1", "test2"]',
        });
    }

    const normalizedItems = items
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0);

    if (normalizedItems.length !== 1) {
        return res.status(400).json({ error: 'Update stock by id requires exactly 1 value' });
    }

    const updateQuery = 'UPDATE stock SET items = ? WHERE id = ?';
    connection.query(updateQuery, [normalizedItems[0], stockId], (err, result) => {
        if (err) {
            console.error('Error updating stock:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Stock not found' });
        }

        return res.json({ message: 'Stock updated successfully' });
    });
};

exports.deleteStockById = (req, res) => {
    const stockId = req.params.id;
    const deleteQuery = 'DELETE FROM stock WHERE id = ?';
    connection.query(deleteQuery, [stockId], (err, result) => {
        if (err) {
            console.error('Error deleting stock:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Stock not found' });
        }
        return res.json({ message: 'Stock deleted successfully' });
    });
};