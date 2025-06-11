const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  userId: String,
  cartId: String,
  cartItems: [
    {
      productId: String,
      title: String,
      image: String,
      price: String,
      quantity: Number,
      size: String,  // <-- Added size field here
    },
  ],
  addressInfo: {
    addressId: String,
    address: String,
    city: String,
    pincode: String,
    phone: String,
    notes: String,
  },
  orderStatus: {
    type: String,
    default: "pending",
  },
  paymentMethod: {
    type: String,
    enum: ["cod", "razorpay"],
    default: "cod",
  },
  paymentStatus: {
    type: String,
    default: "pending",
  },
  totalAmount: Number,
  orderDate: {
    type: Date,
    default: Date.now,
  },
  orderUpdateDate: {
    type: Date,
    default: Date.now,
  },
  paymentId: String,
  payerId: String,
});

module.exports = mongoose.model("Order", OrderSchema);
