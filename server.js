/**
 * Online Pharmacy Management System
 * Backend Server - server.js
 * Technology: Node.js, Express.js, mysql2 (Connection Pool with Promises)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MySQL Connection Pool Configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'online_pharmacy_db',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Verify database connectivity at startup
async function verifyDatabaseConnection() {
    try {
        const connection = await pool.getConnection();
        console.log(' Successfully connected to MySQL database: ' + dbConfig.database);
        connection.release();
    } catch (error) {
        console.error('❌ Failed to connect to MySQL database:', error.message);
        console.error('Please verify that MySQL service is running and credentials in server.js are correct.');
    }
}
verifyDatabaseConnection();

// ============================================================================
// 1. DASHBOARD STATISTICS API
// ============================================================================

app.get('/api/stats', async (req, res) => {
    try {
        const [medCount] = await pool.query('SELECT COUNT(*) AS total_medicines FROM medicines');
        const [lowStock] = await pool.query('SELECT COUNT(*) AS low_stock FROM medicines WHERE stock <= 20');
        const [orderCount] = await pool.query('SELECT COUNT(*) AS total_orders FROM orders');
        const [revenue] = await pool.query("SELECT COALESCE(SUM(total_amount), 0) AS total_revenue FROM orders WHERE status != 'Cancelled'");
        const [userCount] = await pool.query("SELECT COUNT(*) AS total_customers FROM users WHERE role = 'customer'");
        const [expiringSoon] = await pool.query("SELECT COUNT(*) AS expiring_soon FROM medicines WHERE expiry_date <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)");

        res.json({
            success: true,
            data: {
                total_medicines: medCount[0].total_medicines,
                low_stock: lowStock[0].low_stock,
                total_orders: orderCount[0].total_orders,
                total_revenue: parseFloat(revenue[0].total_revenue).toFixed(2),
                total_customers: userCount[0].total_customers,
                expiring_soon: expiringSoon[0].expiring_soon
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics', error: error.message });
    }
});

// ============================================================================
// 2. USERS / CUSTOMERS APIS
// ============================================================================

// GET /api/users - Retrieve all users (or filter by role)
app.get('/api/users', async (req, res) => {
    try {
        const { role } = req.query;
        let query = 'SELECT user_id, name, email, phone, role FROM users';
        const params = [];

        if (role) {
            query += ' WHERE role = ?';
            params.push(role);
        }
        query += ' ORDER BY user_id ASC';

        const [users] = await pool.query(query, params);
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
    }
});

// GET /api/users/:id - Retrieve single user
app.get('/api/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const [users] = await pool.query('SELECT user_id, name, email, phone, role FROM users WHERE user_id = ?', [userId]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, data: users[0] });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user', error: error.message });
    }
});

// POST /api/users - Register new user / customer
app.post('/api/users', async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;

        if (!name || !email || !password || !phone) {
            return res.status(400).json({ success: false, message: 'All fields (name, email, password, phone) are required.' });
        }

        const userRole = role === 'admin' ? 'admin' : 'customer';

        const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'A user with this email address already exists.' });
        }

        const [result] = await pool.query(
            'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
            [name.trim(), email.trim(), password, phone.trim(), userRole]
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully!',
            data: { user_id: result.insertId, name, email, phone, role: userRole }
        });
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ success: false, message: 'Failed to register user', error: error.message });
    }
});

// ============================================================================
// 3. MEDICINES APIS
// ============================================================================

// GET /api/medicines/categories - Distinct categories
app.get('/api/medicines/categories', async (req, res) => {
    try {
        const [categories] = await pool.query('SELECT DISTINCT category FROM medicines ORDER BY category ASC');
        res.json({ success: true, data: categories.map(c => c.category) });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error.message });
    }
});

// GET /api/medicines - Retrieve all medicines with optional search and category filter
app.get('/api/medicines', async (req, res) => {
    try {
        const { search, category, low_stock } = req.query;
        let query = 'SELECT * FROM medicines WHERE 1=1';
        const params = [];

        if (search) {
            query += ' AND (medicine_name LIKE ? OR manufacturer LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (category && category !== 'All') {
            query += ' AND category = ?';
            params.push(category);
        }

        if (low_stock === 'true') {
            query += ' AND stock <= 20';
        }

        query += ' ORDER BY medicine_id DESC';

        const [medicines] = await pool.query(query, params);
        res.json({ success: true, data: medicines });
    } catch (error) {
        console.error('Error fetching medicines:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch medicines', error: error.message });
    }
});

// GET /api/medicines/:id - Retrieve single medicine
app.get('/api/medicines/:id', async (req, res) => {
    try {
        const medicineId = req.params.id;
        const [medicines] = await pool.query('SELECT * FROM medicines WHERE medicine_id = ?', [medicineId]);

        if (medicines.length === 0) {
            return res.status(404).json({ success: false, message: 'Medicine not found' });
        }
        res.json({ success: true, data: medicines[0] });
    } catch (error) {
        console.error('Error fetching medicine:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch medicine', error: error.message });
    }
});

// POST /api/medicines - Add new medicine
app.post('/api/medicines', async (req, res) => {
    try {
        const { medicine_name, category, manufacturer, price, stock, expiry_date } = req.body;

        if (!medicine_name || !category || !manufacturer || price === undefined || stock === undefined || !expiry_date) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const numPrice = parseFloat(price);
        const numStock = parseInt(stock);

        if (isNaN(numPrice) || numPrice < 0) {
            return res.status(400).json({ success: false, message: 'Price must be a valid non-negative number.' });
        }
        if (isNaN(numStock) || numStock < 0) {
            return res.status(400).json({ success: false, message: 'Stock must be a valid non-negative integer.' });
        }

        const [result] = await pool.query(
            'INSERT INTO medicines (medicine_name, category, manufacturer, price, stock, expiry_date) VALUES (?, ?, ?, ?, ?, ?)',
            [medicine_name.trim(), category.trim(), manufacturer.trim(), numPrice, numStock, expiry_date]
        );

        res.status(201).json({
            success: true,
            message: 'Medicine added successfully!',
            data: {
                medicine_id: result.insertId,
                medicine_name,
                category,
                manufacturer,
                price: numPrice,
                stock: numStock,
                expiry_date
            }
        });
    } catch (error) {
        console.error('Error adding medicine:', error);
        res.status(500).json({ success: false, message: 'Failed to add medicine', error: error.message });
    }
});

// PUT /api/medicines/:id - Update existing medicine
app.put('/api/medicines/:id', async (req, res) => {
    try {
        const medicineId = req.params.id;
        const { medicine_name, category, manufacturer, price, stock, expiry_date } = req.body;

        if (!medicine_name || !category || !manufacturer || price === undefined || stock === undefined || !expiry_date) {
            return res.status(400).json({ success: false, message: 'All fields are required for update.' });
        }

        const numPrice = parseFloat(price);
        const numStock = parseInt(stock);

        if (isNaN(numPrice) || numPrice < 0 || isNaN(numStock) || numStock < 0) {
            return res.status(400).json({ success: false, message: 'Price and stock must be valid non-negative values.' });
        }

        const [result] = await pool.query(
            'UPDATE medicines SET medicine_name = ?, category = ?, manufacturer = ?, price = ?, stock = ?, expiry_date = ? WHERE medicine_id = ?',
            [medicine_name.trim(), category.trim(), manufacturer.trim(), numPrice, numStock, expiry_date, medicineId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Medicine not found' });
        }

        res.json({
            success: true,
            message: 'Medicine updated successfully!',
            data: { medicine_id: parseInt(medicineId), medicine_name, category, manufacturer, price: numPrice, stock: numStock, expiry_date }
        });
    } catch (error) {
        console.error('Error updating medicine:', error);
        res.status(500).json({ success: false, message: 'Failed to update medicine', error: error.message });
    }
});

// DELETE /api/medicines/:id - Delete medicine
app.delete('/api/medicines/:id', async (req, res) => {
    try {
        const medicineId = req.params.id;

        // Check if medicine is present in any past orders
        const [usedInOrders] = await pool.query('SELECT COUNT(*) AS count FROM order_items WHERE medicine_id = ?', [medicineId]);
        if (usedInOrders[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete this medicine because it is referenced in ${usedInOrders[0].count} order item(s). Consider setting stock to 0 instead.`
            });
        }

        const [result] = await pool.query('DELETE FROM medicines WHERE medicine_id = ?', [medicineId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Medicine not found' });
        }

        res.json({ success: true, message: 'Medicine deleted successfully!' });
    } catch (error) {
        console.error('Error deleting medicine:', error);
        res.status(500).json({ success: false, message: 'Failed to delete medicine', error: error.message });
    }
});

// ============================================================================
// 4. ORDERS & ORDER ITEMS APIS (WITH DATABASE TRANSACTIONS & SQL JOINS)
// ============================================================================

// GET /api/orders - Retrieve all orders using SQL JOIN with users
app.get('/api/orders', async (req, res) => {
    try {
        const sql = `
            SELECT 
                o.order_id,
                o.user_id,
                u.name AS customer_name,
                u.email AS customer_email,
                u.phone AS customer_phone,
                o.order_date,
                o.total_amount,
                o.status,
                COUNT(oi.item_id) AS total_items,
                COALESCE(SUM(oi.quantity), 0) AS total_quantity
            FROM orders o
            JOIN users u ON o.user_id = u.user_id
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            GROUP BY o.order_id, o.user_id, u.name, u.email, u.phone, o.order_date, o.total_amount, o.status
            ORDER BY o.order_id DESC
        `;
        const [orders] = await pool.query(sql);
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
    }
});

// GET /api/orders/:id - Retrieve order details with items and medicine names (SQL JOIN)
app.get('/api/orders/:id', async (req, res) => {
    try {
        const orderId = req.params.id;

        // Fetch Order + User details
        const orderSql = `
            SELECT 
                o.order_id,
                o.user_id,
                u.name AS customer_name,
                u.email AS customer_email,
                u.phone AS customer_phone,
                o.order_date,
                o.total_amount,
                o.status
            FROM orders o
            JOIN users u ON o.user_id = u.user_id
            WHERE o.order_id = ?
        `;
        const [orders] = await pool.query(orderSql, [orderId]);

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Fetch Order Items with Medicine details
        const itemsSql = `
            SELECT 
                oi.item_id,
                oi.medicine_id,
                m.medicine_name,
                m.category,
                m.manufacturer,
                oi.quantity,
                oi.price AS unit_price,
                (oi.quantity * oi.price) AS subtotal
            FROM order_items oi
            JOIN medicines m ON oi.medicine_id = m.medicine_id
            WHERE oi.order_id = ?
            ORDER BY oi.item_id ASC
        `;
        const [items] = await pool.query(itemsSql, [orderId]);

        res.json({
            success: true,
            data: {
                order: orders[0],
                items: items
            }
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch order details', error: error.message });
    }
});

// POST /api/orders - Create an order with transaction (Orders + Order Items + Stock Update)
app.post('/api/orders', async (req, res) => {
    const { user_id, items, order_date } = req.body;

    // Basic validation
    if (!user_id || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid order submission. Please provide a user_id and at least one item.'
        });
    }

    const connection = await pool.getConnection();

    try {
        // Begin Transaction
        await connection.beginTransaction();

        // 1. Verify User exists
        const [users] = await connection.query('SELECT user_id, name FROM users WHERE user_id = ?', [user_id]);
        if (users.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Selected customer does not exist.' });
        }

        let calculatedTotal = 0;
        const verifiedItems = [];

        // 2. Lock medicines and verify stock
        for (const item of items) {
            const medicineId = parseInt(item.medicine_id);
            const quantity = parseInt(item.quantity);

            if (isNaN(medicineId) || isNaN(quantity) || quantity <= 0) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'Invalid medicine ID or quantity in order items.' });
            }

            // Lock row using FOR UPDATE to prevent race conditions
            const [medRows] = await connection.query(
                'SELECT medicine_id, medicine_name, price, stock FROM medicines WHERE medicine_id = ? FOR UPDATE',
                [medicineId]
            );

            if (medRows.length === 0) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: `Medicine ID ${medicineId} not found.` });
            }

            const med = medRows[0];

            if (med.stock < quantity) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for "${med.medicine_name}". Available: ${med.stock}, Requested: ${quantity}`
                });
            }

            const unitPrice = parseFloat(med.price);
            calculatedTotal += unitPrice * quantity;

            verifiedItems.push({
                medicine_id: med.medicine_id,
                medicine_name: med.medicine_name,
                quantity: quantity,
                price: unitPrice
            });
        }

        // 3. Insert into orders table
        const orderDateFormatted = order_date || new Date().toISOString().slice(0, 10);
        const [orderResult] = await connection.query(
            'INSERT INTO orders (user_id, order_date, total_amount, status) VALUES (?, ?, ?, ?)',
            [user_id, orderDateFormatted, calculatedTotal.toFixed(2), 'Pending']
        );

        const newOrderId = orderResult.insertId;

        // 4. Insert into order_items and update stock for each item
        for (const item of verifiedItems) {
            await connection.query(
                'INSERT INTO order_items (order_id, medicine_id, quantity, price) VALUES (?, ?, ?, ?)',
                [newOrderId, item.medicine_id, item.quantity, item.price]
            );

            await connection.query(
                'UPDATE medicines SET stock = stock - ? WHERE medicine_id = ?',
                [item.quantity, item.medicine_id]
            );
        }

        // Commit Transaction
        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Order created successfully! Stock updated automatically.',
            data: {
                order_id: newOrderId,
                user_id: user_id,
                customer_name: users[0].name,
                order_date: orderDateFormatted,
                total_amount: calculatedTotal.toFixed(2),
                status: 'Pending',
                items_count: verifiedItems.length
            }
        });
    } catch (error) {
        // Rollback Transaction on any failure
        await connection.rollback();
        console.error('Transaction rolled back due to error:', error);
        res.status(500).json({ success: false, message: 'Order processing failed', error: error.message });
    } finally {
        // Always release connection back to pool
        connection.release();
    }
});

// PUT /api/orders/:id/status - Update order status (with auto stock restoration if cancelled)
app.put('/api/orders/:id/status', async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Processing', 'Completed', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [orders] = await connection.query('SELECT status FROM orders WHERE order_id = ? FOR UPDATE', [orderId]);
        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const currentStatus = orders[0].status;

        // If order is transitioning to 'Cancelled' from an active status, restore stock!
        if (status === 'Cancelled' && currentStatus !== 'Cancelled') {
            const [items] = await connection.query('SELECT medicine_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
            for (const item of items) {
                await connection.query('UPDATE medicines SET stock = stock + ? WHERE medicine_id = ?', [item.quantity, item.medicine_id]);
            }
        }

        // If previously cancelled order is restored back to active status, re-check and deduct stock
        if (currentStatus === 'Cancelled' && status !== 'Cancelled') {
            const [items] = await connection.query('SELECT medicine_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
            for (const item of items) {
                const [med] = await connection.query('SELECT stock, medicine_name FROM medicines WHERE medicine_id = ? FOR UPDATE', [item.medicine_id]);
                if (med.length === 0 || med[0].stock < item.quantity) {
                    await connection.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `Cannot reactivate order: insufficient stock for ${med[0]?.medicine_name || 'medicine'}.`
                    });
                }
                await connection.query('UPDATE medicines SET stock = stock - ? WHERE medicine_id = ?', [item.quantity, item.medicine_id]);
            }
        }

        await connection.query('UPDATE orders SET status = ? WHERE order_id = ?', [status, orderId]);

        await connection.commit();

        res.json({
            success: true,
            message: `Order #${orderId} status updated to "${status}".`
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Failed to update order status', error: error.message });
    } finally {
        connection.release();
    }
});

// DELETE /api/orders/:id - Delete an order
app.delete('/api/orders/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const [result] = await pool.query('DELETE FROM orders WHERE order_id = ?', [orderId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, message: `Order #${orderId} and its items deleted successfully.` });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ success: false, message: 'Failed to delete order', error: error.message });
    }
});

// Root route - serve frontend index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`💊 Online Pharmacy Management System Server Running`);
    console.log(`🌐 Application URL: http://localhost:${PORT}`);
    console.log(`📊 Connected Database: ${dbConfig.database}`);
    console.log(`=======================================================`);
});

