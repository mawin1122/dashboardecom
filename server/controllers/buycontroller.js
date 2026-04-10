const connection = require('../config/db');

const ensureOrderHistoryTable = (callback) => {
    const createQuery = `
        CREATE TABLE IF NOT EXISTS order_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL,
            unit_price DECIMAL(10,2) NOT NULL,
            total_price DECIMAL(10,2) NOT NULL,
            purchased_items TEXT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'completed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;

    connection.query(createQuery, (createErr) => {
        if (createErr) {
            return callback(createErr);
        }

        connection.query('SHOW COLUMNS FROM order_history', (columnsErr, columns) => {
            if (columnsErr) {
                return callback(columnsErr);
            }

            const existing = new Set(columns.map((column) => column.Field));
            const alterQueries = [];

            if (!existing.has('product_id')) {
                alterQueries.push('ALTER TABLE order_history ADD COLUMN product_id INT NOT NULL AFTER user_id');
            }
            if (!existing.has('status')) {
                alterQueries.push("ALTER TABLE order_history ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'completed' AFTER total_price");
            }
            if (!existing.has('purchased_items')) {
                alterQueries.push('ALTER TABLE order_history ADD COLUMN purchased_items TEXT NULL AFTER total_price');
            }
            if (!existing.has('created_at')) {
                alterQueries.push('ALTER TABLE order_history ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER status');
            }
            if (!existing.has('updated_at')) {
                alterQueries.push('ALTER TABLE order_history ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');
            }

            const runAlter = (index) => {
                if (index >= alterQueries.length) {
                    return callback(null);
                }

                connection.query(alterQueries[index], (alterErr) => {
                    if (alterErr) {
                        return callback(alterErr);
                    }
                    return runAlter(index + 1);
                });
            };

            return runAlter(0);
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


exports.buyProduct = (req, res) => {
    const { product_id, quantity } = req.body;
    const productId = Number(product_id);
    const qty = Number(quantity);

    if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(qty) || qty <= 0) {
        return res.status(400).json({ error: 'product_id and quantity are required' });
    }

    ensureOrderHistoryTable((schemaErr) => {
        if (schemaErr) {
            console.error('Error ensuring order_history table:', schemaErr);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        connection.beginTransaction((txErr) => {
        if (txErr) {
            console.error('Error starting transaction:', txErr);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        connection.query(
            'SELECT id, name, price FROM products WHERE id = ? LIMIT 1',
            [productId],
            (productErr, productResults) => {
                if (productErr) {
                    return connection.rollback(() => {
                        console.error('Error checking product:', productErr);
                        return res.status(500).json({ error: 'Internal Server Error' });
                    });
                }

                if (productResults.length === 0) {
                    return connection.rollback(() => res.status(404).json({ error: 'Product not found' }));
                }

                const product = productResults[0];
                const unitPrice = Number(product.price);
                if (!Number.isFinite(unitPrice) || unitPrice < 0) {
                    return connection.rollback(() => res.status(400).json({ error: 'Invalid product price' }));
                }

                const checkStockQuery = 'SELECT id, items FROM stock WHERE product_id = ? ORDER BY id ASC LIMIT ?';
                connection.query(checkStockQuery, [productId, qty], (stockErr, stockResults) => {
                    if (stockErr) {
                        return connection.rollback(() => {
                            console.error('Error checking stock:', stockErr);
                            return res.status(500).json({ error: 'Internal Server Error' });
                        });
                    }

                    if (stockResults.length < qty) {
                        return connection.rollback(() => res.status(400).json({ error: 'Not enough stock available' }));
                    }

                    const stockIds = stockResults.map((item) => item.id);
                    const pointsNeeded = Math.ceil(unitPrice * qty);

                    connection.query('SELECT point FROM users WHERE id = ? LIMIT 1', [req.user.id], (pointErr, pointResults) => {
                        if (pointErr) {
                            return connection.rollback(() => {
                                console.error('Error checking user points:', pointErr);
                                return res.status(500).json({ error: 'Internal Server Error' });
                            });
                        }

                        if (pointResults.length === 0) {
                            return connection.rollback(() => res.status(404).json({ error: 'User not found' }));
                        }

                        const userPoints = Number(pointResults[0].point || 0);
                        if (userPoints < pointsNeeded) {
                            return connection.rollback(() => res.status(400).json({
                                error: 'Not enough points',
                                points_needed: pointsNeeded,
                                current_points: userPoints,
                            }));
                        }

                        const deleteQuery = `DELETE FROM stock WHERE id IN (${stockIds.map(() => '?').join(',')})`;
                        connection.query(deleteQuery, stockIds, (deleteErr) => {
                            if (deleteErr) {
                                return connection.rollback(() => {
                                    console.error('Error consuming stock:', deleteErr);
                                    return res.status(500).json({ error: 'Internal Server Error' });
                                });
                            }

                            connection.query(
                                'UPDATE users SET point = GREATEST(COALESCE(point, 0) - ?, 0) WHERE id = ?',
                                [pointsNeeded, req.user.id],
                                (userUpdateErr) => {
                                    if (userUpdateErr) {
                                        return connection.rollback(() => {
                                            console.error('Error updating user points:', userUpdateErr);
                                            return res.status(500).json({ error: 'Internal Server Error' });
                                        });
                                    }

                                    connection.query('SHOW COLUMNS FROM products', (schemaErr, columns) => {
                                        if (schemaErr) {
                                            return connection.rollback(() => {
                                                console.error('Error checking products schema:', schemaErr);
                                                return res.status(500).json({ error: 'Internal Server Error' });
                                            });
                                        }

                                        const hasStockColumn = columns.some((column) => column.Field === 'stock');
                                        const consumedStockEntries = stockResults
                                            .map((item) => ({
                                                stock_id: Number(item.id),
                                                item: String(item.items || '').trim(),
                                            }))
                                            .filter((entry) => Number.isInteger(entry.stock_id) && entry.stock_id > 0 && entry.item.length > 0);
                                        const purchasedItemsText = consumedStockEntries.length > 0
                                            ? JSON.stringify(consumedStockEntries)
                                            : null;

                                        const finish = () => {
                                            connection.commit((commitErr) => {
                                                if (commitErr) {
                                                    return connection.rollback(() => {
                                                        console.error('Error committing transaction:', commitErr);
                                                        return res.status(500).json({ error: 'Internal Server Error' });
                                                    });
                                                }

                                                return res.json({
                                                    message: 'Product bought successfully',
                                                    product_id: productId,
                                                    quantity: qty,
                                                    unit_price: unitPrice,
                                                    points_spent: pointsNeeded,
                                                    consumed: consumedStockEntries,
                                                });
                                            });
                                        };

                                        const insertHistoryAndFinish = () => {
                                            const insertHistoryQuery = 'INSERT INTO order_history (user_id, product_id, quantity, unit_price, total_price, purchased_items, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
                                            connection.query(
                                                insertHistoryQuery,
                                                [req.user.id, productId, qty, unitPrice, unitPrice * qty, purchasedItemsText || null, 'completed'],
                                                (historyErr, historyResult) => {
                                                    if (historyErr) {
                                                        return connection.rollback(() => {
                                                            console.error('Error inserting order history:', historyErr);
                                                            return res.status(500).json({
                                                                error: 'Order history insert failed',
                                                                detail: historyErr.sqlMessage || 'Internal Server Error',
                                                            });
                                                        });
                                                    }
                                                    console.log('Order history recorded with ID:', historyResult.insertId);
                                                    return finish();
                                                }
                                            );
                                        };

                                        if (!hasStockColumn) {
                                            return insertHistoryAndFinish();
                                        }

                                        connection.query(
                                            'UPDATE products SET stock = GREATEST(COALESCE(stock, 0) - ?, 0) WHERE id = ?',
                                            [qty, productId],
                                            (updateErr) => {
                                                if (updateErr) {
                                                    return connection.rollback(() => {
                                                        console.error('Error syncing products.stock:', updateErr);
                                                        return res.status(500).json({ error: 'Internal Server Error' });
                                                    });
                                                }

                                                return insertHistoryAndFinish();
                                            }
                                        );
                                    });
                                }
                            );
                        });
                    });
                });
            }
        );
        });
    });
};