
````md
# 💰 Digital Wallet API

A secure and scalable digital wallet backend system (inspired by Bkash/Nagad) built with **Node.js**, **Express.js**, and **MongoDB**. This API enables users, agents, and admins to interact with a digital wallet system to perform core financial operations such as adding money, withdrawing, sending funds, and managing users and wallets.

---

## 🎯 Project Overview

This backend system includes:

- 🔐 JWT-based authentication
- 🎭 Role-based authorization (`admin`, `agent`, `user`)
- 💼 Wallet creation and management
- 🔁 Transaction processing: add money, withdraw, send, cash-in, cash-out
- 📊 Full transaction history
- 🔒 Role-protected routes and validations

---

## 🚀 Technologies Used

- **Node.js**, **Express.js**
- **MongoDB**, **Mongoose**
- **JWT** for secure token-based authentication
- **Zod** for input validation
- **TypeScript** (optional if applicable)
- **Bcrypt** for password hashing

## 🔧 Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/mdshamim125/digital-wallet-management-api.git
cd digital-wallet-management-api
```
````

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root:

```env
PORT=5000
DB_URL=

# JWT
JWT_ACCESS_SECRET=
JWT_ACCESS_EXPIRES=
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES=

# BCRYPT
BCRYPT_SALT_ROUND=

# SUPER ADMIN
ADMIN_EMAIL=
ADMIN_PASSWORD=

Fill these with  your own data.
```

### 4. Run the server

```bash
npm run dev
```

---

## 📌 Features Implemented

### ✅ Authentication

- Secure login/logout with JWT
- Refresh token mechanism
- Password hashing

### ✅ Role-Based Access

- `admin`, `user`, `agent`
- Middleware for route protection

### ✅ User Operations

- Add money
- Withdraw funds
- Send money to others
- View personal transaction history

### ✅ Agent Operations

- Cash-in: Add money to user wallets
- Cash-out: Withdraw from user wallets

### ✅ Admin Capabilities

- Manage user status
- Approve/suspend agents
- View all users, agents, wallets, transactions

### ✅ Wallet & Transactions

- Wallets auto-created at registration (initial balance: ৳50)
- All transactions are stored and trackable
- Wallet balances updated atomically

---

## 🌐 API Endpoints

### 🔐 Auth Endpoints

| Method | Endpoint                     | Description                     |
| ------ | ---------------------------- | ------------------------------- |
| POST   | `/api/v1/auth/login`         | User login                      |
| POST   | `/api/v1/auth/logout`        | User logout                     |
| POST   | `/api/v1/auth/refresh-token` | Refresh JWT token / Create user |

---

### 👤 User Endpoints

| Method | Endpoint                         | Description        |
| ------ | -------------------------------- | ------------------ |
| PATCH  | `/api/v1/user/status-update/:id` | Update user status |
| GET    | `/api/v1/user/all-users`         | Get all users      |

---

### 💸 Transaction Endpoints

| Method | Endpoint                               | Description                  |
| ------ | -------------------------------------- | ---------------------------- |
| GET    | `/api/v1/transaction/all-transactions` | Admin: View all transactions |
| POST   | `/api/v1/transaction/cash-in`          | Agent: Add money to user     |
| POST   | `/api/v1/transaction/add-money`        | User: Add money via bank     |
| POST   | `/api/v1/transaction/cash-out`         | Agent: Withdraw from user    |
| POST   | `/api/v1/transaction/withdraw`         | User: Withdraw funds         |
| POST   | `/api/v1/transaction/send-money`       | User: Send money to user     |
| GET    | `/api/v1/transaction/transactions`     | User: Get personal history   |

---

### 💼 Wallet Endpoints

| Method | Endpoint                     | Description              |
| ------ | ---------------------------- | ------------------------ |
| GET    | `/api/v1/wallet/get-wallets` | Get user's own wallet(s) |

---

## 🔐 Role-Based Access Control

| Role  | Access                                                    |
| ----- | --------------------------------------------------------- |
| User  | Add money, send money, withdraw, view transaction history |
| Agent | Cash-in, cash-out, view agent wallet/transactions         |
| Admin | Manage users, agents, transactions, view all data         |

---

`
