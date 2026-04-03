const connection = require('../config/db');

const getProductSchema = (callback) => {
    connection.query('SHOW COLUMNS FROM products', (err, columns) => {
        if (err) {
            return callback(err);
        }

        const names = new Set(columns.map((column) => column.Field));
        callback(null, {
            hasStock: names.has('stock'),
            hasStatus: names.has('status'),
            hasImageUrl: names.has('image_url'),
            hasImageLegacy: names.has('image'),
        });
    });
};

const buildSelectQuery = (schema, withWhereById = false) => {
    const stockSelect = schema.hasStock
        ? 'p.stock'
        : '(SELECT COUNT(*) FROM stock s WHERE s.product_id = p.id) AS stock';
    const statusSelect = schema.hasStatus ? 'p.status' : "'active' AS status";
    const imageSelect = schema.hasImageUrl
        ? 'p.image_url'
        : schema.hasImageLegacy
            ? 'p.image AS image_url'
            : 'NULL AS image_url';

    const base = `
        SELECT p.id, p.name, p.category, p.price, ${stockSelect}, ${statusSelect}, p.description, ${imageSelect}
        FROM products p
    `;

    if (withWhereById) {
        return `${base} WHERE p.id = ?`;
    }

    return `${base} ORDER BY p.id DESC`;
};

exports.addProduct = (req, res) => {
    const {
        name,
        category,
        price,
        stock,
        status,
        description,
        image_url,
    } = req.body;

    if (!name || Number.isNaN(Number(price))) {
        return res.status(400).json({ error: 'Name and valid price are required' });
    }

    getProductSchema((schemaErr, schema) => {
        if (schemaErr) {
            console.error('Error reading products schema:', schemaErr);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        const columns = ['name', 'category', 'price', 'description'];
        const values = [
            name,
            category || null,
            Number(price),
            description || null,
        ];

        if (schema.hasStock) {
            columns.push('stock');
            values.push(stock !== undefined && stock !== null && stock !== '' ? Number(stock) : 0);
        }

        if (schema.hasStatus) {
            columns.push('status');
            values.push(status || 'active');
        }

        if (schema.hasImageUrl) {
            columns.push('image_url');
            values.push(image_url || null);
        } else if (schema.hasImageLegacy) {
            columns.push('image');
            values.push(image_url || null);
        }

        const placeholders = columns.map(() => '?').join(', ');
        const query = `INSERT INTO products (${columns.join(', ')}) VALUES (${placeholders})`;

        connection.query(query, values, (err, result) => {
            if (err) {
                console.error('Error adding product:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            return res.status(201).json({ message: 'Product added successfully', productId: result.insertId });
        });
    });
};

exports.getProducts = (req, res) => {
    getProductSchema((schemaErr, schema) => {
        if (schemaErr) {
            console.error('Error reading products schema:', schemaErr);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        const query = buildSelectQuery(schema, false);
        connection.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching products:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            return res.json(results);
        });
    });
};

exports.getProductById = (req, res) => {
    const productId = req.params.id;

    getProductSchema((schemaErr, schema) => {
        if (schemaErr) {
            console.error('Error reading products schema:', schemaErr);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        const query = buildSelectQuery(schema, true);
        connection.query(query, [productId], (err, results) => {
            if (err) {
                console.error('Error fetching product:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }
            return res.json(results[0]);
        });
    });
};

exports.updateProduct = (req, res) => {
    const productId = req.params.id;
    const {
        name,
        category,
        price,
        stock,
        status,
        description,
        image_url,
    } = req.body;

    if (!name || Number.isNaN(Number(price))) {
        return res.status(400).json({ error: 'Name and valid price are required' });
    }

    getProductSchema((schemaErr, schema) => {
        if (schemaErr) {
            console.error('Error reading products schema:', schemaErr);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        const setParts = ['name = ?', 'category = ?', 'price = ?', 'description = ?'];
        const values = [
            name,
            category || null,
            Number(price),
            description || null,
        ];

        if (schema.hasStock) {
            setParts.push('stock = ?');
            values.push(stock !== undefined && stock !== null && stock !== '' ? Number(stock) : 0);
        }

        if (schema.hasStatus) {
            setParts.push('status = ?');
            values.push(status || 'active');
        }

        if (schema.hasImageUrl) {
            setParts.push('image_url = ?');
            values.push(image_url || null);
        } else if (schema.hasImageLegacy) {
            setParts.push('image = ?');
            values.push(image_url || null);
        }

        values.push(productId);

        const query = `UPDATE products SET ${setParts.join(', ')} WHERE id = ?`;
        connection.query(query, values, (err, result) => {
            if (err) {
                console.error('Error updating product:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }
            return res.json({ message: 'Product updated successfully' });
        });
    });
};

exports.deleteProduct = (req, res) => {
    const productId = req.params.id;
    const query = 'DELETE FROM products WHERE id = ?';
    connection.query(query, [productId], (err) => {
        if (err) {
            console.error('Error deleting product:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        return res.json({ message: 'Product deleted successfully' });
    });
};
