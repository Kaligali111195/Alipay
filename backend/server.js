const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const cloudinary = require('./cloudinaryConfig');

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

const orderSchema = new mongoose.Schema({
    items: Array,
    total: Number,
    date: { type: Date, default: Date.now }
});

const Item = mongoose.model('Item', itemSchema);
const Order = mongoose.model('Order', orderSchema);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/add-item', upload.single('picture'), (req, res) => {
    const { category, item, price } = req.body;
    const picture = req.file;

    if (!category || !item || !price || !picture) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    cloudinary.uploader.upload(picture.path, { folder: 'items' }, (error, result) => {
        if (error) {
            return res.status(500).json({ success: false, message: 'Error uploading to Cloudinary' });
        }

        const newItem = new Item({
            category,
            item,
            price: parseFloat(price),
            picture: result.secure_url,
            soldOut: false
        });

        newItem.save()
            .then(() => res.json({ success: true }))
            .catch(err => res.status(500).json({ success: false, message: err.message }));
    });
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

app.post('/checkout', (req, res) => {
    const { cart } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart is empty or invalid' });
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const newOrder = new Order({ items: cart, total });

    newOrder.save()
        .then(() => res.json({ success: true, message: 'Order placed successfully' }))
        .catch(err => res.status(500).json({ success: false, message: err.message }));
});

app.get('/orders', (req, res) => {
    Order.find()
        .then(orders => res.json({ orders }))
        .catch(err => res.status(500).json({ success: false, message: err.message }));
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
