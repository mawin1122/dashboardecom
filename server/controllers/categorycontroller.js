const connection = require('../config/db');

exports.getCategories = (req, res) => {
    const query = 'SELECT id, name, image_url FROM categories ORDER BY name ASC';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching categories:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(results);
    });
};

exports.getCategoryById = (req, res) => {
    const categoryId = req.params.id;
    const query = 'SELECT id, name, image_url FROM categories WHERE id = ?';
    connection.query(query, [categoryId], (err, results) => {
        if (err) {
            console.error('Error fetching category:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json(results[0]);
    });
};

exports.getProductsByCategory = (req, res) => {
    const category = req.params.category;
    const query = 'SELECT * FROM products WHERE category = ?';
    connection.query(query, [category], (err, results) => {
        if (err) {
            console.error('Error fetching products by category:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(results);
    });
};

exports.addCategory = (req, res) => {
    const { name, category, image_url } = req.body;
    const normalizedName = (name || category || '').trim();

    if (!normalizedName) {
        return res.status(400).json({ error: 'Category name is required' });
    }

    const query = 'INSERT INTO categories (name, image_url) VALUES (?, ?)';
    connection.query(query, [normalizedName, image_url || null], (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Category name already exists' });
            }
            console.error('Error adding category:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.status(201).json({ message: 'Category added successfully', categoryId: results.insertId });
    });
};

exports.updateCategory = (req, res) => {
    const categoryId = req.params.id;
    const { name, category, image_url } = req.body;
    const normalizedName = (name || category || '').trim();

    if (!normalizedName) {
        return res.status(400).json({ error: 'Category name is required' });
    }

    const query = 'UPDATE categories SET name = ?, image_url = ? WHERE id = ?';
    connection.query(query, [normalizedName, image_url || null, categoryId], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Category name already exists' });
            }
            console.error('Error updating category:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json({ message: 'Category updated successfully' });
    });
};

exports.deleteCategory = (req, res) => {
    const categoryId = req.params.id;
    const categoryQuery = 'SELECT name FROM categories WHERE id = ?';

    connection.query(categoryQuery, [categoryId], (categoryErr, categoryResults) => {
        if (categoryErr) {
            console.error('Error fetching category before delete:', categoryErr);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (categoryResults.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const categoryName = categoryResults[0].name;
        const usedByProductsQuery = 'SELECT COUNT(*) AS total FROM products WHERE category = ?';

        connection.query(usedByProductsQuery, [categoryName], (usageErr, usageResults) => {
            if (usageErr) {
                console.error('Error checking category usage:', usageErr);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            if (usageResults[0].total > 0) {
                return res.status(409).json({
                    error: 'Cannot delete category because products are still using it',
                });
            }

            const deleteQuery = 'DELETE FROM categories WHERE id = ?';
            connection.query(deleteQuery, [categoryId], (deleteErr) => {
                if (deleteErr) {
                    console.error('Error deleting category:', deleteErr);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }
                res.json({ message: 'Category deleted successfully' });
            });
        });
    });
};
