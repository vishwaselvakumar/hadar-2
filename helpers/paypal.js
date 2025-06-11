// config/razorpay.js
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: "rzp_test_YourKeyId",       // 🔑 Replace with your actual Razorpay Key ID
  key_secret: "YourKeySecretHere",    // 🔐 Replace with your actual Razorpay Secret
});

module.exports = razorpay;
