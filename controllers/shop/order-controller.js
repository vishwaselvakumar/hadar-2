const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");

// Razorpay config
const razorpay = new Razorpay({
  key_id: "rzp_test_nhhCl0y64g4Yt5",
  key_secret: "3QiGoDxzkR92q0BhHUz33zvp",
});

// === Razorpay Order Creation ===
const createOrder = async (req, res) => {
  try {
    const {
      userId,
      cartId,
      cartItems,
      addressInfo,
      totalAmount,
      orderStatus = "pending",
      paymentMethod = "razorpay",
      paymentStatus = "pending",
      orderDate = new Date(),
      orderUpdateDate = new Date(),
    } = req.body;

    if (
      !userId || !cartItems || !addressInfo || !totalAmount || paymentMethod !== "razorpay"
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields or invalid payment method",
      });
    }

    const options = {
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    const newOrder = new Order({
      userId,
      cartId,
      cartItems,
      addressInfo,
      totalAmount,
      orderStatus,
      paymentMethod,
      paymentStatus,
      orderDate,
      orderUpdateDate,
      paymentId: razorpayOrder.id,
    });

    await newOrder.save();

    return res.status(201).json({
      success: true,
      razorpayOrder,
      orderId: newOrder._id,
      redirectUrl: "http://localhost:5173/shop/razorpay-return",
    });
  } catch (err) {
    console.error("Create Razorpay Order Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
    });
  }
};


// === Razorpay Payment Verification ===
const capturePayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ success: false, message: "Missing payment verification fields" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const generated_signature = crypto
      .createHmac("sha256", razorpay.key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    // Update order
    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentId = razorpay_payment_id;

    // Reduce stock
    for (const item of order.cartItems) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
      }

      if (product.totalStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for product: ${product.title}`,
        });
      }

      product.totalStock -= item.quantity;
      await product.save();
    }

    // Clear cart
    if (order.cartId) {
      await Cart.findByIdAndDelete(order.cartId);
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Payment verified and order confirmed",
      data: order,
    });
  } catch (err) {
    console.error("Capture Payment Error:", err);
    res.status(500).json({ success: false, message: "Failed to verify payment" });
  }
};

// === COD Order Creation ===
const createCodOrder = async (req, res) => {
  try {
    const {
      userId,
      cartItems,
      addressInfo,
      totalAmount,
      orderStatus = "pending",
      paymentMethod = "cod",
      paymentStatus = "pending",
      orderDate = new Date(),
      orderUpdateDate = new Date(),
      cartId,
    } = req.body;

    if (
      !userId ||
      !cartItems ||
      !totalAmount ||
      !addressInfo ||
      paymentMethod !== "cod"
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields or invalid payment method",
      });
    }

    // Increase each product's price by ₹100
    const updatedCartItems = cartItems.map(item => ({
      ...item,
      price: item.price + 100,
    }));

    // Recalculate totalAmount with increased prices
    const updatedTotalAmount = updatedCartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const newOrder = new Order({
      userId,
      cartId,
      cartItems: updatedCartItems,
      addressInfo,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount: updatedTotalAmount,
      orderDate,
      orderUpdateDate,
    });

    await newOrder.save();

    res.status(201).json({
      success: true,
      message: "COD order placed successfully with price increased by ₹100/item",
      orderId: newOrder._id,
    });
  } catch (err) {
    console.error("Create COD Order Error:", err);
    res.status(500).json({ success: false, message: "Failed to create COD order" });
  }
};




// === Get All Orders for a User ===
const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId }).sort({ orderDate: -1 });

    if (!orders.length) {
      return res.status(404).json({ success: false, message: "No orders found for this user" });
    }

    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    console.error("Get Orders Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

// === Get Single Order Details ===
const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    console.error("Get Order Details Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch order details" });
  }
};

module.exports = {
  createOrder,        // Razorpay
  capturePayment,     // Razorpay
  createCodOrder,     // COD
  getAllOrdersByUser,
  getOrderDetails,
};
