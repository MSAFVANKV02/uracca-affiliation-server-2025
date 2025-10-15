import Order from "../models/uracca-order.js";

export const updateOrderCompleteStatus = async (req, res) => {
  const { orderId } = req.params;

  try {
    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // ✅ Update each product's orderCollectionStatus inside this order
    order.products = order.products.map((p) => ({
      ...p.toObject(),
      orderCollectionStatus: "completed",
    }));

    await order.save();

    return res.status(200).json({
      message: "Order marked as completed",
      order,
    });
  } catch (error) {
    console.error("Error updating order collection status:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
