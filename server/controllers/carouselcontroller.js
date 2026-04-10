const connection = require('../config/db');

const ensureCarouselTable = (callback) => {
    const query = `
        CREATE TABLE IF NOT EXISTS carousels (
            id INT AUTO_INCREMENT PRIMARY KEY,
            image_url VARCHAR(500) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `;

    connection.query(query, (err) => {
        if (err) {
            console.error('Error ensuring carousels table exists:', err);
            return callback(err);
        }

        return callback(null);
    });
};

exports.getCarousels = (req, res) => {
    ensureCarouselTable((tableError) => {
        if (tableError) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        const query = 'SELECT id, image_url FROM carousels ORDER BY id ASC';
        connection.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching carousels:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            res.json(results);
        });
    });
};


exports.addCarousel = (req, res) => {
    const { image_url } = req.body;
    if (!image_url) {
        return res.status(400).json({ error: 'Image URL is required' });
    }
    ensureCarouselTable((tableError) => {
        if (tableError) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        const query = 'INSERT INTO carousels (image_url) VALUES (?)';
        connection.query(query, [image_url], (err, results) => {
            if (err) {
                console.error('Error adding carousel:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            res.status(201).json({ message: 'Carousel added successfully', carouselId: results.insertId });
        });
    });
};

exports.updateCarousel = (req, res) => {
    const carouselId = req.params.id;
    const { image_url } = req.body;
    if (!image_url) {
        return res.status(400).json({ error: 'Image URL is required' });
    }
    ensureCarouselTable((tableError) => {
        if (tableError) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        const query = 'UPDATE carousels SET image_url = ? WHERE id = ?';
        connection.query(query, [image_url, carouselId], (err, results) => {
            if (err) {
                console.error('Error updating carousel:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Carousel not found' });
            }
            res.json({ message: 'Carousel updated successfully' });
        });
    });
};

exports.deleteCarousel = (req, res) => {
    const carouselId = req.params.id;
    ensureCarouselTable((tableError) => {
        if (tableError) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        const query = 'DELETE FROM carousels WHERE id = ?';
        connection.query(query, [carouselId], (err, results) => {
            if (err) {
                console.error('Error deleting carousel:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Carousel not found' });
            }
            res.json({ message: 'Carousel deleted successfully' });
        });
    });
}