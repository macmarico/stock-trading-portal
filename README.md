# Stock Trading Portal

## 📌 Overview

This is a **Stock Trading Portal** that allows users to buy and sell stocks while maintaining trade history and lot tracking. It supports **FIFO (First In, First Out) and LIFO (Last In, First Out)** methods for selling stocks. The application also includes **bulk trade uploads via CSV**.

## 🚀 Features

- **User Authentication** (JWT-based authentication)
- **Buy & Sell Trades**
- **Trade History & Lot Management**
- **FIFO & LIFO Support for Selling**
- **Bulk Trade Upload via CSV**
- **RESTful APIs with Swagger Documentation**
- **Database Transactions for Data Integrity**

---

## 📦 Tech Stack

- **Backend:** Node.js, Express.js, Sequelize (ORM), PostgreSQL
- **Frontend:** Next.js, React.js, Tailwind CSS
- **Authentication:** JWT (JSON Web Token)
- **Database:** PostgreSQL (with Sequelize ORM)
- **File Uploads:** Multer (for CSV files)
- **Testing:** Jest (for unit tests)
- **API Documentation:** Swagger

---

## 🛠 Installation & Setup

### 1️⃣ Clone the repository

```sh
  git clone https://github.com/macmarico/stock-trading-portal.git
  cd stock-trading-portal
```

### 2️⃣ Install dependencies

```sh
  npm install
```

### 3️⃣ Set up environment variables

Create a `.env` file in the root folder and add the following:

```env
PORT=5000
DATABASE_URL=postgres://user:password@localhost:5432/stock_trading_db
JWT_SECRET=your_secret_key
```


### 5️⃣ Start the server

```sh
  npm run dev
```

Backend will run on `http://localhost:5000`

### 6️⃣ Start the frontend

Navigate to the `apps/frontend` folder and run:

```sh
  npm run dev
```

Frontend will run on `http://localhost:3000`

### 5️⃣ Run test case

```sh
  cd apps/backend
  npx jest tests/trade.test.js
```

---

## 🔥 API Endpoints

### Authentication

| Method | Endpoint           | Description            |
| ------ | ------------------ | ---------------------- |
| POST   | `/api/auth/signup` | Register a new user    |
| POST   | `/api/auth/login`  | Login user and get JWT |

### Trades

| Method | Endpoint             | Description                   |
| ------ | -------------------- | ----------------------------- |
| POST   | `/api/trades/create` | Create a new trade (BUY/SELL) |
| GET    | `/api/trades`        | Get all trades                |
| GET    | `/api/trades/:id`    | Get trade by ID               |
| DELETE | `/api/trades/:id`    | Delete a trade                |

### Bulk Trade Upload

| Method | Endpoint                    | Description           |
| ------ | --------------------------- | --------------------- |
| POST   | `/api/trades/upload-trades` | Upload trades via CSV |

CSV Format:

```csv
stock_name,quantity,price,broker_name,trade_type
Apple,100,150,Broker A,BUY
Tesla,200,160,Broker B,BUY
Apple,50,155,Broker C,SELL
```

### Lots

| Method | Endpoint    | Description  |
| ------ | ----------- | ------------ |
| GET    | `/api/lots` | Get all lots |

---

## 🧪 Running Tests

To run unit tests:

```sh
  npm test
```

---

## 📚 Swagger API Documentation

Swagger documentation is available at:

```
http://localhost:5000/api-docs
```

---

## 🐞 Troubleshooting

- **Cannot find module '@tailwindcss/oxide-linux-x64-gnu' on Vercel?**

  ```sh
  npm install tailwindcss postcss autoprefixer
  ```

  Then redeploy.

- **EPERM error while building Next.js?** Run:

  ```sh
  rm -rf .next
  npm run build
  ```

---

## ✨ Contribution

Feel free to fork and contribute by submitting a Pull Request.

---

## 📝 License

This project is licensed under the **MIT License**.

