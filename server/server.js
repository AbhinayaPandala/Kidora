
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Product = require("./models/Product");
const Admin = require("./models/Admin");
const Order = require("./models/Order");

const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(
  "/products",
  express.static(path.join(__dirname, "../client/public/products"))
);

// Verify server configuration
function checkAdminConfiguration(req, res, next) {
  if (
    !process.env.ADMIN_TOKEN_SECRET ||
    process.env.ADMIN_TOKEN_SECRET.length < 32
  ) {
    return res.status(500).json({
      message:
        "Admin authentication is not configured. Check ADMIN_TOKEN_SECRET in .env.",
    });
  }

  next();
}

// Create a signed login token
function createAdminToken(admin) {
  return jwt.sign(
    {
      id: admin._id.toString(),
      role: "admin",
    },
    process.env.ADMIN_TOKEN_SECRET,
    { expiresIn: "2h" }
  );
}

// Protect admin-only routes
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      message: "Please log in as an admin.",
    });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.ADMIN_TOKEN_SECRET
    );

    if (payload.role !== "admin" || !payload.id) {
      return res.status(401).json({
        message: "Invalid admin session.",
      });
    }

    req.adminId = payload.id;
    next();
  } catch {
    return res.status(401).json({
      message: "Your admin session has expired. Please log in again.",
    });
  }
}

// Public test route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the KIDORA API!",
    status: "Backend is running",
  });
});

// Create the first admin account only.
// This route closes automatically after an admin account exists.
app.post(
  "/api/admin/register",
  checkAdminConfiguration,
  async (req, res) => {
    try {
      const existingAdmin = await Admin.exists({});

      if (existingAdmin) {
        return res.status(403).json({
          message:
            "Admin registration is closed. An admin account already exists.",
        });
      }

      const { username, email, password, setupKey } = req.body || {};

      // A setup key is required to prevent public visitors
      // from claiming the first admin account.
      if (
        !process.env.ADMIN_SETUP_KEY ||
        process.env.ADMIN_SETUP_KEY.length < 24
      ) {
        return res.status(500).json({
          message:
            "Set ADMIN_SETUP_KEY in the server .env file before registering the first admin.",
        });
      }

      if (
        typeof setupKey !== "string" ||
        setupKey.length !== process.env.ADMIN_SETUP_KEY.length ||
        !require("crypto").timingSafeEqual(
          Buffer.from(setupKey),
          Buffer.from(process.env.ADMIN_SETUP_KEY)
        )
      ) {
        return res.status(403).json({
          message: "Invalid admin setup key.",
        });
      }

      if (
        typeof username !== "string" ||
        username.trim().length < 3 ||
        username.trim().length > 30
      ) {
        return res.status(400).json({
          message: "Username must be between 3 and 30 characters.",
        });
      }

      if (
        typeof email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ) {
        return res.status(400).json({
          message: "Enter a valid email address.",
        });
      }

      if (
        typeof password !== "string" ||
        password.length < 12 ||
        password.length > 72
      ) {
        return res.status(400).json({
          message: "Password must be between 12 and 72 characters.",
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const admin = await Admin.create({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
      });

      return res.status(201).json({
        message: "KIDORA admin account created successfully.",
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
        },
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          message: "That username or email is already registered.",
        });
      }

      console.error("Admin registration error:", error.message);

      return res.status(500).json({
        message: "Could not create the admin account.",
      });
    }
  }
);

// Admin login using the account stored in MongoDB
app.post(
  "/api/admin/login",
  checkAdminConfiguration,
  async (req, res) => {
    try {
      const { username, password } = req.body || {};

      if (
        typeof username !== "string" ||
        typeof password !== "string"
      ) {
        return res.status(400).json({
          message: "Enter your username and password.",
        });
      }

      const admin = await Admin.findOne({
        username: username.trim(),
      }).select("+passwordHash");

      if (!admin) {
        return res.status(401).json({
          message: "Incorrect admin username or password.",
        });
      }

      const passwordMatches = await bcrypt.compare(
        password,
        admin.passwordHash
      );

      if (!passwordMatches) {
        return res.status(401).json({
          message: "Incorrect admin username or password.",
        });
      }

      return res.json({
        message: "Admin login successful.",
        token: createAdminToken(admin),
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
        },
      });
    } catch (error) {
      console.error("Admin login error:", error.message);

      return res.status(500).json({
        message: "Could not log in. Please try again.",
      });
    }
  }
);

// Public: customers can view products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch products",
      error: error.message,
    });
  }
});

// Protected: add a product
app.post(
  "/api/products",
  checkAdminConfiguration,
  requireAdmin,
  async (req, res) => {
    try {
      const product = await Product.create(req.body);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({
        message: "Failed to add product",
        error: error.message,
      });
    }
  }
);

// Protected: edit an existing product
app.put(
  "/api/products/:id",
  checkAdminConfiguration,
  requireAdmin,
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          message: "Invalid product ID.",
        });
      }

      const allowedFields = [
        "name",
        "description",
        "category",
        "price",
        "image",
        "brand",
        "ageGroup",
        "stock",
        "featured",
      ];

      const updates = {};

      for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
          updates[field] = req.body[field];
        }
      }

      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!product) {
        return res.status(404).json({
          message: "Product not found.",
        });
      }

      res.json({
        message: "Product updated successfully.",
        product,
      });
    } catch (error) {
      res.status(400).json({
        message: "Failed to update product.",
        error: error.message,
      });
    }
  }
);

// Protected: delete a product
app.delete(
  "/api/products/:id",
  checkAdminConfiguration,
  requireAdmin,
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          message: "Invalid product ID.",
        });
      }

      const product = await Product.findByIdAndDelete(req.params.id);

      if (!product) {
        return res.status(404).json({
          message: "Product not found.",
        });
      }

      res.json({
        message: "Product deleted successfully.",
        product,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to delete product.",
      });
    }
  }
);

// Helper to generate readable, unique order number
function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `KID-${timestamp}-${randomSuffix}`;
}

// Public: Place an order
app.post("/api/orders", async (req, res) => {
  try {
    const { customer, shippingAddress, items, paymentMethod = "COD", notes } = req.body || {};

    // Validate customer details
    if (!customer || typeof customer !== "object") {
      return res.status(400).json({ message: "Customer details are required." });
    }

    const { name, phone, email } = customer;
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Customer full name is required." });
    }

    if (typeof phone !== "string" || !phone.trim() || !/^[\d+\-\s()]{7,15}$/.test(phone.trim())) {
      return res.status(400).json({ message: "Please provide a valid contact phone number." });
    }

    if (email && (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    // Validate shipping address
    if (!shippingAddress || typeof shippingAddress !== "object") {
      return res.status(400).json({ message: "Delivery address details are required." });
    }

    const { address, city, state, postalCode } = shippingAddress;
    if (typeof address !== "string" || address.trim().length < 5) {
      return res.status(400).json({ message: "Please provide a complete street address." });
    }

    if (typeof city !== "string" || !city.trim()) {
      return res.status(400).json({ message: "City is required." });
    }

    if (typeof state !== "string" || !state.trim()) {
      return res.status(400).json({ message: "State is required." });
    }

    if (typeof postalCode !== "string" || !postalCode.trim() || postalCode.trim().length < 3) {
      return res.status(400).json({ message: "Please enter a valid postal / PIN code." });
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Your order must contain at least one item." });
    }

    // Prepare items and verify prices and stock directly against MongoDB
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const productId = item.productId || item.product || item._id;
      const quantity = parseInt(item.quantity, 10);

      if (!productId || !mongoose.isValidObjectId(productId)) {
        return res.status(400).json({ message: "Invalid product ID in order items." });
      }

      if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ message: "Item quantity must be at least 1." });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: `Product no longer available (ID: ${productId}).` });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          message: `Insufficient stock for "${product.name}". Only ${product.stock} available.`,
        });
      }

      const unitPrice = Number(product.price);
      const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
      subtotal += lineTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: unitPrice,
        quantity,
        image: product.image || "",
        lineTotal,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    // Free delivery over ₹500, otherwise ₹50
    const deliveryFee = subtotal >= 500 ? 0 : 50;
    const totalAmount = Math.round((subtotal + deliveryFee) * 100) / 100;

    // Safe stock update with rollback
    const decrementedProducts = [];
    try {
      for (const item of orderItems) {
        const updated = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { returnDocument: "after" }
        );

        if (!updated) {
          throw new Error(
            `Unable to reserve stock for "${item.name}". Please try again.`
          );
        }

        decrementedProducts.push({
          productId: item.product,
          quantity: item.quantity,
        });
      }

      const orderNumber = generateOrderNumber();

      const order = await Order.create({
        orderNumber,
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          email: email ? email.trim().toLowerCase() : "",
        },
        shippingAddress: {
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
        },
        items: orderItems,
        subtotal,
        deliveryFee,
        totalAmount,
        paymentMethod: paymentMethod === "Cash on Delivery" ? "Cash on Delivery" : "COD",
        paymentStatus: "Pending",
        orderStatus: "Pending",
        notes: typeof notes === "string" ? notes.trim() : "",
      });

      return res.status(201).json({
        message: "Order placed successfully!",
        order,
      });
    } catch (stockError) {
      // Rollback any stocks decremented in this attempt
      for (const item of decrementedProducts) {
        try {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: item.quantity },
          });
        } catch (rollbackError) {
          console.error("Stock rollback error:", rollbackError.message);
        }
      }

      return res.status(400).json({
        message: stockError.message || "Failed to process order stock.",
      });
    }
  } catch (error) {
    console.error("Order creation error:", error.message);
    return res.status(500).json({
      message: "An unexpected error occurred while placing your order.",
    });
  }
});

// Public: Retrieve order details by order number for confirmation
app.get("/api/orders/:orderNumber", async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await Order.findOne({ orderNumber }).select(
      "orderNumber customer shippingAddress items subtotal deliveryFee totalAmount paymentMethod paymentStatus orderStatus createdAt"
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch order details." });
  }
});

// Admin: Get all orders
app.get(
  "/api/admin/orders",
  checkAdminConfiguration,
  requireAdmin,
  async (req, res) => {
    try {
      const orders = await Order.find().sort({ createdAt: -1 });
      res.json(orders);
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch orders.",
        error: error.message,
      });
    }
  }
);

// Admin: Update order status
app.patch(
  "/api/admin/orders/:id/status",
  checkAdminConfiguration,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { orderStatus, paymentStatus } = req.body || {};

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid order ID." });
      }

      const validOrderStatuses = [
        "Pending",
        "Confirmed",
        "Shipped",
        "Delivered",
        "Cancelled",
      ];
      const validPaymentStatuses = ["Pending", "Paid", "Failed"];

      if (orderStatus && !validOrderStatuses.includes(orderStatus)) {
        return res.status(400).json({ message: "Invalid order status." });
      }

      if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({ message: "Invalid payment status." });
      }

      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found." });
      }

      const previousStatus = order.orderStatus;

      // Restock if moving to Cancelled from a non-Cancelled state
      if (orderStatus === "Cancelled" && previousStatus !== "Cancelled") {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity },
          });
        }
      } else if (previousStatus === "Cancelled" && orderStatus && orderStatus !== "Cancelled") {
        // Re-check and re-decrement stock if moving out of Cancelled
        for (const item of order.items) {
          const updated = await Product.findOneAndUpdate(
            { _id: item.product, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } }
          );
          if (!updated) {
            return res.status(400).json({
              message: `Cannot uncancel order: insufficient stock for "${item.name}".`,
            });
          }
        }
      }

      if (orderStatus) order.orderStatus = orderStatus;
      if (paymentStatus) order.paymentStatus = paymentStatus;

      await order.save();

      res.json({
        message: "Order updated successfully.",
        order,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to update order status.",
        error: error.message,
      });
    }
  }
);

// Connect to MongoDB, then start the server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("KIDORA connected to MongoDB successfully!");

    app.listen(PORT, () => {
      console.log(
        `KIDORA server running at http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
