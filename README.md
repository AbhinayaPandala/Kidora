# Kidora - Kids E-Commerce Platform

Kidora is a full-stack e-commerce web application designed for kids' products, toys, clothing, and accessories. Built with React (Vite) on the frontend and Node.js, Express, and MongoDB on the backend.

---

## 🚀 Features

- **Storefront & Catalog**: Browse categorized products with filtering and search.
- **Cart & Checkout**: Interactive shopping cart with seamless order checkout.
- **Admin Dashboard**: Secure admin portal for managing products, categories, stock, and viewing incoming orders.
- **Responsive Design**: Optimized for desktop, tablet, and mobile browsing.

---

## 🛠️ Tech Stack

### Client (Frontend)
- React 19
- Vite
- Lucide React (Icons)
- Vanilla CSS with modern responsive styling

### Server (Backend)
- Node.js & Express 5
- MongoDB with Mongoose ODM
- JWT (JSON Web Tokens) & bcryptjs for authentication
- CORS & dotenv

---

## 📁 Project Structure

```text
Kidora/
├── client/                 # React frontend application
│   ├── public/             # Static assets & product images
│   ├── src/                # React components, styles, and state
│   │   ├── components/     # UI components (Header, Footer, Cart, Checkout, etc.)
│   │   ├── Admin.jsx       # Admin management interface
│   │   └── App.jsx         # Main application root
│   ├── package.json
│   └── vite.config.js
│
├── server/                 # Express backend API
│   ├── models/             # Mongoose schemas (Product, Order, Admin)
│   ├── server.js           # Express API server & routes
│   ├── seedProduct.js      # Database seeding scripts
│   ├── package.json
│   └── .env.example        # Environment variable template
│
└── .gitignore              # Root gitignore protecting secrets & node_modules
```

---

## ⚙️ Setup and Installation

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd Kidora
```

### 2. Configure the Backend
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory (reference `.env.example`):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/kidora
ADMIN_USERNAME=kidoraadmin
ADMIN_PASSWORD=your_secure_password
ADMIN_TOKEN_SECRET=your_jwt_secret_key
ADMIN_SETUP_KEY=your_admin_setup_key
```

Start the backend server:
```bash
npm run dev
```

### 3. Configure the Frontend
In a new terminal:
```bash
cd client
npm install
npm run dev
```

The frontend will run at `http://localhost:5173` (or port assigned by Vite) and connect to the backend at `http://localhost:5000`.
