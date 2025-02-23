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

const itemsFilePath = path.join(__dirname, 'items.json');
const ordersFilePath = path.join(__dirname, 'orders.json');

// Load items and orders from JSON files
function loadItems() {
    if (fs.existsSync(itemsFilePath)) {
        const data = fs.readFileSync(itemsFilePath);
        items = JSON.parse(data);
    }
}

function loadOrders() {
    if (fs.existsSync(ordersFilePath)) {
        const data = fs.readFileSync(ordersFilePath);
        orders = JSON.parse(data);
        orderId = orders.length > 0 ? orders[orders.length - 1].id + 1 : 1;
    }
}

// Save items and orders to JSON files
function saveItems() {
    fs.writeFileSync(itemsFilePath, JSON.stringify(items, null, 2));
}

function saveOrders() {
    fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2));
}

app.use(bodyParser.json());
app.use(cors()); // Ensure CORS is enabled
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
        saveItems(); // Save items to JSON file
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
    saveItems(); // Save items to JSON file
    console.log('Item removed:', item);
    res.json({ success: true });
});

app.post('/toggle-sold-out', (req, res) => {
    const { item } = req.body;
    const itemToUpdate = items.find(i => i.item === item);
    if (itemToUpdate) {
        itemToUpdate.soldOut = !itemToUpdate.soldOut;
        saveItems(); // Save items to JSON file
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
    saveOrders(); // Save orders to JSON file
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

// Load items and orders when the server starts
loadItems();
loadOrders();

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
