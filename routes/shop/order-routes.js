const express = require("express");

const {
  createOrder,
  getAllOrdersByUser,
  getOrderDetails,
  capturePayment,
  createCodOrder
} = require("../../controllers/shop/order-controller");

const router = express.Router();

router.post("/create/razorpay", createOrder);
router.post("/create/cod", createCodOrder);
router.post("/capture", capturePayment);
router.get("/list/:userId", getAllOrdersByUser);
router.get("/details/:id", getOrderDetails);

module.exports = router;
