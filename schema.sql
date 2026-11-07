-- ========================================================
-- Mini-Project: Online Pharmacy Management System
-- Database Schema and Sample Data
-- ========================================================

CREATE DATABASE IF NOT EXISTS online_pharmacy_db;
USE online_pharmacy_db;

-- --------------------------------------------------------
-- 1. Table structure for table: users
-- --------------------------------------------------------
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS medicines;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 2. Table structure for table: medicines
-- --------------------------------------------------------
CREATE TABLE medicines (
    medicine_id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    expiry_date DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 3. Table structure for table: orders
-- --------------------------------------------------------
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    CONSTRAINT fk_orders_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 4. Table structure for table: order_items
-- --------------------------------------------------------
CREATE TABLE order_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    medicine_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_order_items_order 
        FOREIGN KEY (order_id) REFERENCES orders(order_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_order_items_medicine 
        FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Master Data Insert: users
-- --------------------------------------------------------
INSERT INTO users (user_id, name, email, password, phone, role) VALUES
(1, 'Ujwal Chowdary', 'ujwal@example.com', 'ujwal123', '9876543210', 'customer'),
(2, 'Dr. Ramesh Kumar', 'ramesh@pharmacy.com', 'admin123', '9123456789', 'admin'),
(3, 'Priya Sharma', 'priya@example.com', 'priya123', '9845123456', 'customer'),
(4, 'Anita Reddy', 'anita@example.com', 'anita123', '9765432109', 'customer'),
(5, 'Vikram Singh', 'vikram@example.com', 'vikram123', '9988776655', 'customer');

-- --------------------------------------------------------
-- Master Data Insert: medicines
-- --------------------------------------------------------
INSERT INTO medicines (medicine_id, medicine_name, category, manufacturer, price, stock, expiry_date) VALUES
(1, 'Paracetamol 500mg', 'Analgesic / Antipyretic', 'Sun Pharma', 25.50, 150, '2027-12-31'),
(2, 'Amoxicillin 250mg', 'Antibiotic', 'Cipla Ltd', 85.00, 80, '2026-08-15'),
(3, 'Cetirizine 10mg', 'Antihistamine', 'Dr. Reddy Labs', 35.00, 120, '2027-04-30'),
(4, 'Metformin 500mg', 'Antidiabetic', 'Abbott Healthcare', 45.75, 200, '2026-11-20'),
(5, 'Pantoprazole 40mg', 'Antacid', 'Torrent Pharma', 60.00, 95, '2027-06-15'),
(6, 'Azithromycin 500mg', 'Antibiotic', 'Lupin Ltd', 120.00, 60, '2026-09-10'),
(7, 'Ibuprofen 400mg', 'Anti-inflammatory', 'Alkem Labs', 40.00, 110, '2027-01-25');

-- --------------------------------------------------------
-- Transaction Data Insert: orders
-- --------------------------------------------------------
INSERT INTO orders (order_id, user_id, order_date, total_amount, status) VALUES
(1, 1, '2026-11-05', 111.00, 'Completed'),
(2, 3, '2026-11-06', 170.00, 'Processing'),
(3, 4, '2026-11-07', 85.00, 'Pending');

-- --------------------------------------------------------
-- Transaction Data Insert: order_items
-- --------------------------------------------------------
INSERT INTO order_items (item_id, order_id, medicine_id, quantity, price) VALUES
(1, 1, 1, 2, 25.50), -- 2 * 25.50 = 51.00
(2, 1, 5, 1, 60.00), -- 1 * 60.00 = 60.00 (Total = 111.00)
(3, 2, 2, 2, 85.00), -- 2 * 85.00 = 170.00
(4, 3, 2, 1, 85.00); -- 1 * 85.00 = 85.00

