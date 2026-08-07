const Notification = require("../models/Notification");

// Checks a product's stock level and creates a notification if needed.
const checkStockAndNotify = async (product) => {
  try {
    if (product.quantity <= 0) {
      await Notification.create({
        type: "Out of Stock",
        message: `${product.name} is now out of stock.`,
        product: product._id,
      });
    } else if (product.quantity <= product.minStock) {
      await Notification.create({
        type: "Low Stock",
        message: `${product.name} stock is low (${product.quantity} left, min ${product.minStock}).`,
        product: product._id,
      });
    }
  } catch (err) {
    console.error("Notification error:", err.message);
  }
};

module.exports = { checkStockAndNotify };
