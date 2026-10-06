const { Dispute, OrderItem } = require("../models");
const mongoose = require("mongoose"); // Added missing import

// Check if an order item is eligible for dispute
exports.checkDisputeEligibility = async (req, res) => {
  try {
    const { orderItemId } = req.params;
    const userId = req.user.id; // Sửa từ _id thành id
    
    console.log("Checking eligibility for orderItemId:", orderItemId);
    console.log("User ID:", userId);
    
    if (!userId) {
      console.log("User ID is missing in the request:", req.user);
      return res.status(401).json({ message: "Authentication required. User ID not found." });
    }

    // Verify that the order item exists
    const orderItem = await OrderItem.findById(orderItemId);
    
    if (!orderItem) {
      return res.status(404).json({ message: "Order item not found" });
    }
    
    console.log("Order item found:", orderItem);
    
    // Check if order ID exists
    if (!orderItem.orderId) {
      console.log("Order ID is missing in the orderItem:", orderItem);
      return res.status(404).json({ message: "Order reference not found in this order item" });
    }
    
    // Now get the order separately to ensure we have the correct data
    const order = await mongoose.model("Order").findById(orderItem.orderId);
    
    if (!order) {
      console.log("Order not found for orderItem:", orderItem);
      return res.status(404).json({ message: "Order information not found" });
    }
    
    console.log("Order found:", order);
    
    // Check if the order belongs to the user making the request
    if (!order.buyerId) {
      console.log("Order has no buyerId:", order);
      return res.status(404).json({ message: "Order buyer information not found" });
    }

    console.log("Order buyerId:", order.buyerId);
    console.log("User ID for comparison:", userId);
    
    // Convert both to strings explicitly for safe comparison
    const orderBuyerId = String(order.buyerId);
    const currentUserId = String(userId);
    
    if (orderBuyerId !== currentUserId) {
      console.log("User IDs don't match:", {orderBuyerId, currentUserId});
      return res.status(403).json({ 
        eligible: false,
        message: "You can only create disputes for your own orders" 
      });
    }

    // Check if the order item status allows disputes
    if (orderItem.status !== "shipped") {
      return res.status(200).json({ 
        eligible: false,
        message: "You can only create disputes for shipped items"
      });
    }

    // Check if a dispute for this order item already exists
    const existingDispute = await Dispute.findOne({ orderItemId });
    if (existingDispute) {
      return res.status(200).json({ 
        eligible: false,
        message: "A dispute for this order item already exists",
        disputeId: existingDispute._id
      });
    }

    // If all checks pass, the item is eligible for dispute
    res.status(200).json({
      eligible: true,
      message: "This item is eligible for dispute"
    });
  } catch (error) {
    console.error("Error checking dispute eligibility:", error);
    res.status(500).json({ message: "Error checking dispute eligibility", error: error.message });
  }
};

// Create a new dispute
exports.createDispute = async (req, res) => {
  try {
    const { orderItemId, description } = req.body;
    const userId = req.user.id; // Sửa từ _id thành id
    
    console.log("Creating dispute for orderItemId:", orderItemId);
    console.log("User ID:", userId);
    
    if (!userId) {
      console.log("User ID is missing in the request:", req.user);
      return res.status(401).json({ message: "Authentication required. User ID not found." });
    }

    // Verify that the order item exists
    const orderItem = await OrderItem.findById(orderItemId);
    
    if (!orderItem) {
      return res.status(404).json({ message: "Order item not found" });
    }
    
    console.log("Order item found:", orderItem);
    
    // Check if order ID exists
    if (!orderItem.orderId) {
      console.log("Order ID is missing in the orderItem:", orderItem);
      return res.status(404).json({ message: "Order reference not found in this order item" });
    }
    
    // Now get the order separately to ensure we have the correct data
    const order = await mongoose.model("Order").findById(orderItem.orderId);
    
    if (!order) {
      console.log("Order not found for orderItem:", orderItem);
      return res.status(404).json({ message: "Order information not found" });
    }
    
    console.log("Order found:", order);
    
    // Check if the order belongs to the user making the request
    if (!order.buyerId) {
      console.log("Order has no buyerId:", order);
      return res.status(404).json({ message: "Order buyer information not found" });
    }

    console.log("Order buyerId:", order.buyerId);
    console.log("User ID for comparison:", userId);
    
    // Convert both to strings explicitly for safe comparison
    const orderBuyerId = String(order.buyerId);
    const currentUserId = String(userId);
    
    if (orderBuyerId !== currentUserId) {
      console.log("User IDs don't match:", {orderBuyerId, currentUserId});
      return res.status(403).json({ message: "You can only create disputes for your own orders" });
    }
    
    // Check if the order item status allows disputes
    if (orderItem.status !== "shipped") {
      return res.status(400).json({ 
        message: "You can only create disputes for shipped items",
        currentStatus: orderItem.status
      });
    }

    // Check if a dispute for this order item already exists
    const existingDispute = await Dispute.findOne({ orderItemId });
    if (existingDispute) {
      return res.status(400).json({ message: "A dispute for this order item already exists" });
    }

    // Create the dispute
    const dispute = new Dispute({
      orderItemId,
      raisedBy: userId,
      description
    });

    await dispute.save();
    res.status(201).json({
      success: true,
      message: "Dispute created successfully",
      dispute
    });
  } catch (error) {
    console.error("Error creating dispute:", error);
    res.status(500).json({ message: "Error creating dispute", error: error.message });
  }
};

// Get all disputes for the current user
exports.getBuyerDisputes = async (req, res) => {
  try {
    const userId = req.user.id; // Sửa từ _id thành id
    
    if (!userId) {
      console.log("User ID is missing in the request:", req.user);
      return res.status(401).json({ message: "Authentication required. User ID not found." });
    }
    
    const disputes = await Dispute.find({ raisedBy: userId })
      .populate({
        path: 'orderItemId',
        populate: {
          path: 'productId',
          select: 'name images price'
        }
      })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: disputes.length,
      disputes
    });
  } catch (error) {
    console.error("Error fetching disputes:", error);
    res.status(500).json({ message: "Error fetching disputes", error: error.message });
  }
};

// Get a single dispute by ID
exports.getDisputeDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // Sửa từ _id thành id
    
    if (!userId) {
      console.log("User ID is missing in the request:", req.user);
      return res.status(401).json({ message: "Authentication required. User ID not found." });
    }
    
    const dispute = await Dispute.findById(id)
      .populate({
        path: 'orderItemId',
        populate: [
          {
            path: 'productId',
            select: 'name images price description'
          },
          {
            path: 'orderId',
            select: 'orderNumber createdAt totalAmount'
          }
        ]
      });
    
    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }
    
    // Check if the dispute belongs to the user making the request
    if (dispute.raisedBy.toString() !== userId) {
      return res.status(403).json({ message: "You can only view your own disputes" });
    }
    
    res.status(200).json({
      success: true,
      dispute
    });
  } catch (error) {
    console.error("Error fetching dispute details:", error);
    res.status(500).json({ message: "Error fetching dispute details", error: error.message });
  }
};

// Update a dispute (e.g., add more information)
exports.updateDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const userId = req.user.id; // Sửa từ _id thành id
    
    if (!userId) {
      console.log("User ID is missing in the request:", req.user);
      return res.status(401).json({ message: "Authentication required. User ID not found." });
    }
    
    const dispute = await Dispute.findById(id);
    
    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }
    
    // Check if the dispute belongs to the user making the request
    if (dispute.raisedBy.toString() !== userId) {
      return res.status(403).json({ message: "You can only update your own disputes" });
    }
    
    // Only allow updates if the dispute is still open
    if (dispute.status !== "open") {
      return res.status(400).json({ 
        message: "Cannot update dispute that is not in 'open' status",
        currentStatus: dispute.status
      });
    }
    
    dispute.description = description;
    await dispute.save();
    
    res.status(200).json({
      success: true,
      message: "Dispute updated successfully",
      dispute
    });
  } catch (error) {
    console.error("Error updating dispute:", error);
    res.status(500).json({ message: "Error updating dispute", error: error.message });
  }
};

// Cancel a dispute
exports.cancelDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // Sửa từ _id thành id
    
    if (!userId) {
      console.log("User ID is missing in the request:", req.user);
      return res.status(401).json({ message: "Authentication required. User ID not found." });
    }
    
    const dispute = await Dispute.findById(id);
    
    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }
    
    // Check if the dispute belongs to the user making the request
    if (dispute.raisedBy.toString() !== userId) {
      return res.status(403).json({ message: "You can only cancel your own disputes" });
    }
    
    // Only allow cancellation if the dispute is still open or under review
    if (!["open", "under_review"].includes(dispute.status)) {
      return res.status(400).json({ 
        message: "Cannot cancel dispute that has been resolved or closed",
        currentStatus: dispute.status
      });
    }
    
    dispute.status = "closed";
    dispute.resolution = "Cancelled by buyer";
    await dispute.save();
    
    res.status(200).json({
      success: true,
      message: "Dispute cancelled successfully"
    });
  } catch (error) {
    console.error("Error cancelling dispute:", error);
    res.status(500).json({ message: "Error cancelling dispute", error: error.message });
  }
}; 