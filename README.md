# Online Pharmacy Management System

A complete, production-ready Full-Stack Mini-Project built with **Node.js**, **Express.js**, **MySQL (mysql2)**, and **Vanilla JavaScript / HTML5 / CSS3**.

---

## 1. Project Overview & Database Design

### Project Information
- **Project Title:** Online Pharmacy Management System
- **Description:** Manage medicines and pharmacy orders. Customers can search medicines, check prices, and place orders. Admins can maintain medicine stock, expiry dates, and order information.
- **Architecture:** Client-Server Architecture (REST API)
- **Database Engine:** MySQL (InnoDB, utf8mb4)

---

### Database Schema & Tables

The database consists of **4 interconnected tables** designed in 3rd Normal Form (3NF):

```
+-----------------------------------------------------------------------------------+
|                                  DATABASE DESIGN                                  |
+-----------------------------------------------------------------------------------+

     [ users ] (1)
     - user_id (PK, INT AUTO_INCREMENT)
     - name (VARCHAR 100)
     - email (VARCHAR 100, UNIQUE)
     - password (VARCHAR 255)
     - phone (VARCHAR 15)
     - role (VARCHAR 20)
         │
         │ 1:M (One customer places multiple orders)
         ▼
     [ orders ] (M)
     - order_id (PK, INT AUTO_INCREMENT)
     - user_id (FK -> users.user_id)
     - order_date (DATE)
     - total_amount (DECIMAL 10,2)
     - status (VARCHAR 30)
         │
         │ 1:M (One order contains multiple items)
         ▼
     [ order_items ] (M) ◄─────────┐ M:1 (Medicine referenced in items)
     - item_id (PK, INT AUTO_INCREMENT)   │
     - order_id (FK -> orders.order_id)   │
     - medicine_id (FK -> medicines) ─────┘
     - quantity (INT)
     - price (DECIMAL 10,2)
         ▲
         │
     [ medicines ] (1)
     - medicine_id (PK, INT AUTO_INCREMENT)
     - medicine_name (VARCHAR 150)
     - category (VARCHAR 50)
     - manufacturer (VARCHAR 100)
     - price (DECIMAL 10,2)
     - stock (INT)
     - expiry_date (DATE)
```

#### Table 1: `users` (Master Table)
- `user_id` (INT, Primary Key, AUTO_INCREMENT): Unique user identifier.
- `name` (VARCHAR(100), NOT NULL): Customer / Admin full name.
- `email` (VARCHAR(100), NOT NULL, UNIQUE): Email address for identification.
- `password` (VARCHAR(255), NOT NULL): Password string.
- `phone` (VARCHAR(15), NOT NULL): Contact phone number.
- `role` (VARCHAR(20), NOT NULL, DEFAULT 'customer'): Role ('customer' or 'admin').

#### Table 2: `medicines` (Master Table)
- `medicine_id` (INT, Primary Key, AUTO_INCREMENT): Unique medicine identifier.
- `medicine_name` (VARCHAR(150), NOT NULL): Name and dosage of medicine (e.g. Paracetamol 500mg).
- `category` (VARCHAR(50), NOT NULL): Drug category (e.g. Antibiotic, Analgesic, Antacid).
- `manufacturer` (VARCHAR(100), NOT NULL): Manufacturing pharmaceutical firm (e.g. Cipla, Sun Pharma).
- `price` (DECIMAL(10,2), NOT NULL): Unit selling price in INR.
- `stock` (INT, NOT NULL, DEFAULT 0): Available stock units on shelf.
- `expiry_date` (DATE, NOT NULL): Expiration date of current batch.

#### Table 3: `orders` (Transaction Table)
- `order_id` (INT, Primary Key, AUTO_INCREMENT): Unique order invoice ID.
- `user_id` (INT, Foreign Key -> `users.user_id`): Customer who placed the order.
- `order_date` (DATE, NOT NULL): Date the order was made.
- `total_amount` (DECIMAL(10,2), NOT NULL, DEFAULT 0.00): Grand total amount.
- `status` (VARCHAR(30), NOT NULL, DEFAULT 'Pending'): Order lifecycle status ('Pending', 'Processing', 'Completed', 'Cancelled').

#### Table 4: `order_items` (Transaction Detail Table)
- `item_id` (INT, Primary Key, AUTO_INCREMENT): Line item record ID.
- `order_id` (INT, Foreign Key -> `orders.order_id` ON DELETE CASCADE): Parent order ID.
- `medicine_id` (INT, Foreign Key -> `medicines.medicine_id`): Medicine ordered.
- `quantity` (INT, NOT NULL): Quantity purchased.
- `price` (DECIMAL(10,2), NOT NULL): Unit price captured at the time of purchase.

---

## 2. Project Folder Structure

```
Online Pharmacy management system/
│
├── public/
│   ├── index.html     # Semantic single-page application dashboard markup
│   ├── style.css      # Professional responsive healthcare dashboard stylesheet
│   └── app.js         # Vanilla JavaScript Fetch API frontend controller
│
├── server.js          # Express.js REST API server with MySQL connection pooling & transactions
├── schema.sql         # Database schema, table constraints, and sample records
├── package.json       # Project dependencies and startup scripts
└── README.md          # Complete documentation and setup manual
```

---

## 3. Technology Stack

- **Backend:** Node.js (v18+ / v20+ / v25+), Express.js (v4.21.2)
- **Database Driver:** `mysql2/promise` (Connection Pooling & Transactions)
- **Database:** MySQL Server 8.0+
- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+), Fetch API
- **Middleware:** `cors`, `express.json()`, `express.urlencoded()`, `express.static()`

---

## 4. Step-by-Step Setup Instructions (Windows PowerShell)

### Step 1: Install & Verify Node.js and MySQL

Open **Windows PowerShell** and check the versions:

```powershell
node -v
```
*(Should return v18.x, v20.x, or newer)*

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" --version
```
*(Should show MySQL Server 8.0)*

---

### Step 2: Navigate to Project Directory

```powershell
cd "c:\Users\ujwal\Downloads\Online Pharmacy management system"
```

---

### Step 3: Initialize Node.js & Install Dependencies

If not already installed, run:

```powershell
npm.cmd install express mysql2 cors dotenv
```

---

### Step 4: Import Database into MySQL

Run this command in PowerShell to execute `schema.sql`:

```powershell
Get-Content "schema.sql" | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot
```

Or using standard MySQL CLI (if `mysql` is in your Windows PATH):

```powershell
mysql -u root -p < schema.sql
```
*(Enter your MySQL password: `root`)*

---

### Step 5: Start the Backend Server

```powershell
node server.js
```

You will see:
```
=======================================================
💊 Online Pharmacy Management System Server Running
🌐 Application URL: http://localhost:3000
📊 Connected Database: online_pharmacy_db
=======================================================
```

---

### Step 6: Open the Application

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 5. REST API Documentation

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/stats` | Fetches aggregate metrics (total medicines, low stock, orders, revenue, customers, expiring) |

### Medicines
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/medicines` | Returns all medicines (supports query params: `search`, `category`, `low_stock`) |
| `GET` | `/api/medicines/:id` | Returns single medicine by ID |
| `GET` | `/api/medicines/categories` | Returns distinct category names |
| `POST` | `/api/medicines` | Adds a new medicine (`medicine_name`, `category`, `manufacturer`, `price`, `stock`, `expiry_date`) |
| `PUT` | `/api/medicines/:id` | Updates medicine details, price, or stock |
| `DELETE`| `/api/medicines/:id` | Deletes medicine (protected against foreign key conflicts) |

### Orders (Transactional)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/orders` | Retrieves all orders with `JOIN users` and item counts |
| `GET` | `/api/orders/:id` | Retrieves complete order invoice using `JOIN users`, `order_items`, and `medicines` |
| `POST` | `/api/orders` | Creates an order inside a MySQL Transaction (validates stock, deducts stock, creates order and order items) |
| `PUT` | `/api/orders/:id/status` | Updates order status (automatically restores stock if status changed to 'Cancelled') |
| `DELETE`| `/api/orders/:id` | Deletes order and cascades deletion of its items |

### Users / Customers
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | Retrieves all registered users |
| `GET` | `/api/users/:id` | Retrieves a user by ID |
| `POST` | `/api/users` | Registers a new customer or admin |

---

## 6. Verification & Testing

### Test 1: Verify MySQL Connectivity via PowerShell
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot -e "USE online_pharmacy_db; SHOW TABLES;"
```

### Test 2: Verify SQL JOIN Queries
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot -e "
USE online_pharmacy_db;
SELECT o.order_id, u.name AS customer, m.medicine_name, oi.quantity, oi.price, o.status
FROM orders o
JOIN users u ON o.user_id = u.user_id
JOIN order_items oi ON o.order_id = oi.order_id
JOIN medicines m ON oi.medicine_id = m.medicine_id;
"
```

### Test 3: Test API Endpoints via PowerShell `Invoke-RestMethod`
```powershell
# Check stats
Invoke-RestMethod -Uri "http://localhost:3000/api/stats" -Method GET

# Check medicines list
Invoke-RestMethod -Uri "http://localhost:3000/api/medicines" -Method GET
```

---

## 7. Troubleshooting Common Issues

1. **Error: `connect ECONNREFUSED 127.0.0.1:3306`**
   - Ensure MySQL service is running. Start it in PowerShell as Administrator:
     ```powershell
     Start-Service MySQL80
     ```

2. **Error: `Access denied for user 'root'@'localhost'`**
   - Check your password in `server.js` or `.env`. Default is set to `root`.

3. **Error: `npm : File ... cannot be loaded because running scripts is disabled`**
   - Use `npm.cmd` instead of `npm`, e.g., `npm.cmd install`.

