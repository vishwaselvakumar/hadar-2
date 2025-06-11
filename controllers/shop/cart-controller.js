const Cart = require("../../models/Cart");
const Product = require("../../models/Product");

// ✅ ADD TO CART (size required)
const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity, size } = req.body;

    if (!userId || !productId || !quantity || quantity <= 0 || !size) {
      return res.status(400).json({ success: false, message: "Invalid data provided!" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId && item.size === size
    );

    if (itemIndex === -1) {
      cart.items.push({ productId, quantity, size });
    } else {
      cart.items[itemIndex].quantity += quantity;
    }

    await cart.save();

    await cart.populate({
      path: "items.productId",
      select: "image title price salePrice",
    });

    const populateCartItems = cart.items.map((item) => ({
      productId: item.productId?._id,
      image: item.productId?.image || null,
      title: item.productId?.title || "Product not found",
      price: item.productId?.price,
      salePrice: item.productId?.salePrice,
      quantity: item.quantity,
      size: item.size,
    }));

    res.status(200).json({ success: true, data: { ...cart._doc, items: populateCartItems } });
  } catch (error) {
    console.error("addToCart error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ✅ FETCH CART ITEMS
const fetchCartItems = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      select: "image title price salePrice",
    });

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found!" });
    }

    const validItems = cart.items.filter((item) => item.productId);

    if (validItems.length < cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    const populateCartItems = validItems.map((item) => ({
      productId: item.productId._id,
      image: item.productId.image,
      title: item.productId.title,
      price: item.productId.price,
      salePrice: item.productId.salePrice,
      quantity: item.quantity,
      size: item.size,
    }));

    res.status(200).json({
      success: true,
      data: {
        ...cart._doc,
        items: populateCartItems,
      },
    });
  } catch (error) {
    console.error("fetchCartItems error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ✅ UPDATE CART ITEM QUANTITY (NO size required)
const updateCartItemQty = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: "Invalid data provided!" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found!" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: "Cart item not found!" });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    await cart.populate({
      path: "items.productId",
      select: "image title price salePrice",
    });

    const populateCartItems = cart.items.map((item) => ({
      productId: item.productId?._id,
      image: item.productId?.image || null,
      title: item.productId?.title || "Product not found",
      price: item.productId?.price || null,
      salePrice: item.productId?.salePrice || null,
      quantity: item.quantity,
      size: item.size,
    }));

    res.status(200).json({
      success: true,
      data: {
        ...cart._doc,
        items: populateCartItems,
      },
    });
  } catch (error) {
    console.error("updateCartItemQty error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ✅ DELETE CART ITEM (NO size required)
const deleteCartItem = async (req, res) => {
  try {
    const { userId, productId, size } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found!" });
    }

    const initialItemCount = cart.items.length;

    cart.items = cart.items.filter(
      (item) =>
        !(item.productId.toString() === productId && item.size === size)
    );

    if (cart.items.length === initialItemCount) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    await cart.save();

    await cart.populate({
      path: "items.productId",
      select: "image title price salePrice",
    });

    const populateCartItems = cart.items.map((item) => ({
      productId: item.productId._id,
      image: item.productId.image,
      title: item.productId.title,
      price: item.productId.price,
      salePrice: item.productId.salePrice,
      quantity: item.quantity,
      size: item.size,
    }));

    res.status(200).json({
      success: true,
      data: { ...cart._doc, items: populateCartItems },
    });
  } catch (error) {
    console.error("deleteCartItem error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};




module.exports = {
  addToCart,
  updateCartItemQty,
  deleteCartItem,
  fetchCartItems,
};
