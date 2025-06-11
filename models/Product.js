
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    image: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    category: String,
    brand: String,
    price: { type: Number, required: true },
    salePrice: Number,
    totalStock: { type: Number, required: true },
    sizes: [{ type: String, enum: ["S", "M", "L", "XL", "XXL"] }],
  },
  { timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

module.exports = Product;
