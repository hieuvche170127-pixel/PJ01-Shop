// orderController.js

const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Voucher = require('../models/Voucher');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const User = require('../models/User'); // Add this import to fetch user details
const { sendEmail } = require('../services/emailService'); // Add this import assuming emailService.js is in services folder

// Utility function to sync order status based on its items
const syncOrderStatus = async (orderId) => {
  try {
    console.log(`Syncing status for order ${orderId}...`);
    
    // Get all order items for this order
    const orderItems = await OrderItem.find({ orderId });
    
    // If no items found, return early
    if (!orderItems || orderItems.length === 0) {
      console.log(`No order items found for order ${orderId}`);
      return;
    }
    
    console.log(`Found ${orderItems.length} items for order ${orderId}`);
    
    // Check each item's status
    const itemStatuses = orderItems.map(item => ({
      id: item._id,
      status: item.status
    }));
    console.log('Item statuses:', JSON.stringify(itemStatuses));
    
    // Check if all items have status 'shipped'
    const allItemsShipped = orderItems.every(item => item.status === 'shipped');
    console.log(`All items shipped: ${allItemsShipped}`);
    
    // If all items are shipped, update the order status
    if (allItemsShipped) {
      console.log(`Updating order ${orderId} status to 'shipped'`);
      
      // Get current order status
      const order = await Order.findById(orderId);
      console.log(`Current order status: ${order?.status}`);
      
      // Only update if status isn't already 'shipped'
      if (order && order.status !== 'shipped') {
        const updatedOrder = await Order.findByIdAndUpdate(
          orderId, 
          { status: 'shipped' }, 
          { new: true }
        );
        console.log(`Order status updated successfully: ${updatedOrder.status}`);
        return true;
      } else {
        console.log('Order already has shipped status or not found, no update needed');
        return false;
      }
    } else {
      console.log(`Not all items are shipped yet, order status remains unchanged`);
      return false;
    }
  } catch (error) {
    console.error('Error syncing order status:', error);
    return false;
  }
};

const createOrder = async (req, res) => {
  const { selectedItems, selectedAddressId, couponCode } = req.body; // paymentMethod removed as it's handled separately
  const buyerId = req.user.id; // Assumed from auth middleware (e.g., authMiddleware1 sets req.user)

  if (!selectedAddressId || !selectedItems || selectedItems.length === 0) {
    return res.status(400).json({ error: 'Missing required fields: address or items' });
  }

  try {
    // Fetch buyer details for email
    const buyer = await User.findById(buyerId);
    if (!buyer || !buyer.email) {
      return res.status(400).json({ error: 'Buyer email not found' });
    }
    const buyerEmail = buyer.email;

    // Step 1: Calculate subtotal and validate inventory/products
    let subtotal = 0;
    const productDetails = {};

    for (const item of selectedItems) {
      // Validate product exists
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ error: `Product ${item.productId} not found` });
      }

      // Find or create inventory record
      let inventory = await Inventory.findOne({ productId: item.productId });
      
      // If inventory doesn't exist, create it with 0 quantity
      if (!inventory) {
        inventory = new Inventory({
          productId: item.productId,
          quantity: 0
        });
        await inventory.save();
      }
      
      // Validate inventory quantity
      if (inventory.quantity < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient inventory for product ${product.title} (ID: ${item.productId}). Available: ${inventory.quantity}, Requested: ${item.quantity}`
        });
      }

      const unitPrice = product.price;
      subtotal += unitPrice * item.quantity;
      productDetails[item.productId] = { unitPrice };
    }

    // Step 2: Apply voucher if provided
    let discount = 0;
    if (couponCode) {
      const voucher = await Voucher.findOne({ code: couponCode });
      if (!voucher || !voucher.isActive) {
        return res.status(400).json({ error: 'Invalid or inactive voucher' });
      }

      if (subtotal < voucher.minOrderValue) {
        return res.status(400).json({ error: `Order must be at least ${voucher.minOrderValue} to apply this voucher` });
      }

      if (voucher.discountType === 'fixed') {
        discount = voucher.discount;
      } else if (voucher.discountType === 'percentage') {
        const calculatedDiscount = (subtotal * voucher.discount) / 100;
        discount = voucher.maxDiscount > 0 ? Math.min(calculatedDiscount, voucher.maxDiscount) : calculatedDiscount;
      }

      // Increment usedCount and save (triggers pre-save hook to update isActive if needed)
      voucher.usedCount += 1;
      await voucher.save();
    }

    const totalPrice = Math.max(subtotal - discount, 0);

    // Step 3: Create the Order
    const order = new Order({
      buyerId,
      addressId: selectedAddressId,
      totalPrice,
      status: 'pending', // Default status
    });
    await order.save();

    // Step 4: Create OrderItems and deduct from inventory
    for (const item of selectedItems) {
      const orderItem = new OrderItem({
        orderId: order._id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: productDetails[item.productId].unitPrice,
        status: 'pending', // Default status
      });
      await orderItem.save();

      // Deduct quantity from inventory - using upsert:false since we know inventory exists
      await Inventory.findOneAndUpdate(
        { productId: item.productId },
        { 
          $inc: { quantity: -item.quantity },
          $set: { lastUpdated: new Date() }
        },
        { upsert: false } // No upsert, assume inventory exists (we created it if needed above)
      );
    }
    
    // Check if we need to update the order status based on all items
    await syncOrderStatus(order._id);

    // Step 5: Send email notification assuming payment is successful (e.g., for COD or post-order confirmation)
    // Note: If payment is handled separately (e.g., via gateway webhook), move this to a payment success handler.
    // For now, assuming order creation implies payment success for simplicity.
    try {
      const emailSubject = 'Payment Successful and Order Confirmation';
      const emailText = `Dear Customer,\n\nYour payment was successful, and your order has been placed.\nOrder ID: ${order._id}\nTotal Amount: ${totalPrice}\n\nThank you for shopping with us!`;
      await sendEmail(buyerEmail, emailSubject, emailText);
      console.log('Email sent successfully to:', buyerEmail);
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Continue with order creation even if email fails
    }

    // Success response
    return res.status(201).json({ 
      message: 'Order placed successfully',
      orderId: order._id,
      totalPrice 
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Get order history for current buyer
const getBuyerOrders = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { buyerId };
    if (status && ['pending', 'shipping', 'shipped', 'failed to ship', 'rejected'].includes(status)) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Find orders with populated address
    const orders = await Order.find(query)
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('addressId')
      .lean();

    // Get total count for pagination
    const total = await Order.countDocuments(query);

    // Before returning results, check and update each order's status
    console.log(`Checking status for ${orders.length} orders`);
    
    // For each order, check if status needs updating and fetch items
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        // Check and update order status
        await syncOrderStatus(order._id);
        
        // Get the order with potentially updated status
        const updatedOrder = await Order.findById(order._id).lean();
        
        // Get order items with product details
        const items = await OrderItem.find({ orderId: order._id })
          .populate({
            path: 'productId',
            select: 'title image price description'
          })
          .lean();
          
        return { ...updatedOrder, items };
      })
    );

    return res.status(200).json({
      orders: ordersWithItems,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching buyer orders:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Get single order details
const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    const buyerId = req.user.id;

    // First check and update the order status
    console.log(`Checking status for order ${orderId} before returning details`);
    await syncOrderStatus(orderId);

    // Find order and verify it belongs to the current buyer
    const order = await Order.findOne({ _id: orderId, buyerId })
      .populate('addressId')
      .lean();

    if (!order) {
      return res.status(404).json({ error: 'Order not found or unauthorized' });
    }

    // Get order items with product details
    const items = await OrderItem.find({ orderId })
      .populate({
        path: 'productId',
        select: 'title image price description'
      })
      .lean();

    return res.status(200).json({
      order: {
        ...order,
        items
      }
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Update status of an order item
const updateOrderItemStatus = async (req, res) => {
  try {
    const { id } = req.params; // Order item ID
    const { status } = req.body;
    
    console.log(`Updating order item ${id} status to ${status}`);
    
    // Validate status
    if (!status || !['pending', 'shipping', 'shipped', 'failed to ship', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    // Find the order item first to get orderId
    const orderItem = await OrderItem.findById(id);
    if (!orderItem) {
      return res.status(404).json({ error: 'Order item not found' });
    }
    
    // Store orderId for later use
    const orderId = orderItem.orderId;
    console.log(`Order item belongs to order ${orderId}`);
    
    // Update the order item
    const updatedOrderItem = await OrderItem.findByIdAndUpdate(
      id,
      { status },
      { new: true } // Return the updated document
    ).populate('productId', 'title');
    
    console.log(`Successfully updated status of order item for ${updatedOrderItem.productId?.title || 'unknown product'}`);
    
    // If status is 'shipped', check if all items in the order are shipped
    if (status === 'shipped') {
      console.log('Checking if all items in the order are now shipped');
      const orderStatusUpdated = await syncOrderStatus(orderId);
      console.log(`Order status was ${orderStatusUpdated ? 'updated' : 'not updated'}`);
    }
    
    return res.status(200).json({ 
      message: 'Order item status updated successfully', 
      orderItem: updatedOrderItem 
    });
  } catch (error) {
    console.error('Error updating order item status:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

module.exports = { createOrder, getBuyerOrders, getOrderDetails, updateOrderItemStatus };