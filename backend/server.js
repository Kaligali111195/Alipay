const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

let items = [];
let orders = [];
let orderId = 1;

app.use(bodyParser.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.get('/items', (req, res) => {
    console.log('GET /items');
    res.json({ items: items });
});

app.post('/add-item', upload.single('picture'), (req, res) => {
    console.log('POST /add-item', req.body);
    const { category, item, price } = req.body;
    const picture = req.file ? `/uploads/${req.file.filename}` : null;
    if (category && item && price && picture) {
        items.push({ category, item, price, picture, soldOut: false });
        console.log('Item added:', { category, item, price, picture });
        console.log('Picture path:', path.join(__dirname, picture));
        // Check if the file exists
        fs.access(path.join(__dirname, picture), fs.constants.F_OK, (err) => {
            console.log(`${path.join(__dirname, picture)} ${err ? 'does not exist' : 'exists'}`);
        });
        res.status(201).json({ success: true }); // Return 201 Created status
    } else {
        console.error('Failed to add item:', req.body);
        res.status(400).json({ success: false }); // Return 400 Bad Request status
    }
});

app.post('/remove-item', (req, res) => {
    const { item } = req.body;
    items = items.filter(i => i.item !== item);
    console.log('Item removed:', item);
    res.json({ success: true });
});

app.post('/toggle-sold-out', (req, res) => {
    const { item } = req.body;
    const itemToUpdate = items.find(i => i.item === item);
    if (itemToUpdate) {
        itemToUpdate.soldOut = !itemToUpdate.soldOut;
        console.log('Item status updated:', itemToUpdate);
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

app.post('/checkout', (req, res) => {
    const { cart } = req.body;
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const order = { id: orderId++, items: cart, total };
    orders.push(order);
    console.log('Order placed:', order);
    res.json({ success: true });
});

app.get('/orders', (req, res) => {
    console.log('GET /orders');
    res.json({ orders: orders });
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: err.message });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
