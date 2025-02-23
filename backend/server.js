const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ dest: 'uploads/' });

// Update the MongoDB connection string to use MongoDB Atlas
const mongoUri = 'mongodb+srv://kratoskingdom7:khan0987@test.ziqbx.mongodb.net/Bilal?retryWrites=true&w=majority&appName=test';
mongoose.connect(mongoUri);

mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

const itemSchema = new mongoose.Schema({
    category: String,
    item: String,
    price: Number,
    picture: String,
    soldOut: Boolean
});

const Item = mongoose.model('Item', itemSchema);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/add-item', upload.single('picture'), (req, res) => {
    const { category, item, price } = req.body;
    const picture = req.file;

    if (!category || !item || !price || !picture) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const newItem = new Item({
        category,
        item,
        price: parseFloat(price),
        picture: `/uploads/${picture.filename}`,
        soldOut: false
    });

    newItem.save()
        .then(() => res.json({ success: true }))
        .catch(err => res.status(500).json({ success: false, message: err.message }));
});

app.get('/items', (req, res) => {
    Item.find()
        .then(items => res.json({ items }))
        .catch(err => res.status(500).json({ success: false, message: err.message }));
});

app.post('/remove-item', (req, res) => {
    const { item } = req.body;

    Item.deleteOne({ item })
        .then(() => res.json({ success: true }))
        .catch(err => res.status(500).json({ success: false, message: err.message }));
});

app.post('/toggle-sold-out', (req, res) => {
    const { item } = req.body;

    Item.findOne({ item })
        .then(foundItem => {
            if (foundItem) {
                foundItem.soldOut = !foundItem.soldOut;
                return foundItem.save();
            } else {
                throw new Error('Item not found');
            }
        })
        .then(() => res.json({ success: true }))
        .catch(err => res.status(500).json({ success: false, message: err.message }));
});

// Add a /checkout endpoint
app.post('/checkout', (req, res) => {
    const { cart } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart is empty or invalid' });
    }

    // Process the payment (this is a placeholder, replace with actual payment processing logic)
    const paymentSuccess = true;

    if (paymentSuccess) {
        res.json({ success: true, message: 'Payment processed successfully' });
    } else {
        res.status(500).json({ success: false, message: 'Payment processing failed' });
    }
});

// Handle 404 errors
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Not Found' });
});

// Handle other errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
