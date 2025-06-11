// External Dependencies
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config(); // Optional if you use .env for secrets

// Internal Routes
const authRouter = require("./routes/auth/auth-routes");
const adminProductsRouter = require("./routes/admin/products-routes");
const adminOrderRouter = require("./routes/admin/order-routes");

const shopProductsRouter = require("./routes/shop/products-routes");
const shopCartRouter = require("./routes/shop/cart-routes");
const shopAddressRouter = require("./routes/shop/address-routes");
const shopOrderRouter = require("./routes/shop/order-routes");
const shopSearchRouter = require("./routes/shop/search-routes");
const shopReviewRouter = require("./routes/shop/review-routes");

const commonFeatureRouter = require("./routes/common/feature-routes");

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection
mongoose
  .connect("mongodb+srv://vishwaultraflysolutions:RJGme0ZWw2MAgVZs@cluster0.fwwc6.mongodb.net/vish?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((error) => console.error("❌ MongoDB connection error:", error));

// CORS Setup
const allowedOrigins = [
  "https://hadar-clothings.netlify.app",
  "http://localhost:5173",
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Middleware
app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);

// Admin Routes
app.use("/api/admin/products", adminProductsRouter);
app.use("/api/admin/orders", adminOrderRouter);

// Shop Routes
app.use("/api/shop/products", shopProductsRouter);
app.use("/api/shop/cart", shopCartRouter);
app.use("/api/shop/address", shopAddressRouter);
app.use("/api/shop/order", shopOrderRouter);
app.use("/api/shop/search", shopSearchRouter);
app.use("/api/shop/review", shopReviewRouter);

// Common Features
app.use("/api/common/feature", commonFeatureRouter);

// Razorpay Configuration
const razorpay = new Razorpay({
  key_id: "rzp_test_nhhCl0y64g4Yt5",
  key_secret: "3QiGoDxzkR92q0BhHUz33zvp", // move this to .env in production
});

// Razorpay Order Route
app.post("/api/payment/razorpay-order", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const options = {
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    console.error("❌ Razorpay Order creation error:", error);
    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
});

// Razorpay Payment Verification Route
app.post("/api/payment/verify", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", razorpay.key_secret)
      .update(sign)
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Invalid payment signature" });
    }
  } catch (error) {
    console.error("❌ Razorpay verification error:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
