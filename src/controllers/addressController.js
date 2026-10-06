const Address = require('../models/Address');

// Create a new address
exports.createAddress = async (req, res) => {
  try {
    const { fullName, phone, street, city, state, country, isDefault } = req.body;
    const userId = req.user.id;

    if (isDefault) {
      await Address.updateMany({ userId, isDefault: true }, { isDefault: false });
    }

    const newAddress = new Address({
      userId,
      fullName,
      phone,
      street,
      city,
      state,
      country,
      isDefault: isDefault || false,
    });

    await newAddress.save();
    res.status(201).json({ success: true, data: newAddress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all addresses for the user
exports.getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await Address.find({ userId });
    res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update an address
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    if (updateData.isDefault === true) {
      await Address.updateMany({ userId, isDefault: true }, { isDefault: false });
    }

    const address = await Address.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true }
    );

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    res.status(200).json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete an address
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const address = await Address.findOneAndDelete({ _id: id, userId });

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    res.status(200).json({ success: true, message: 'Address deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Set default address
exports.setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await Address.updateMany({ userId, isDefault: true }, { isDefault: false });

    const address = await Address.findOneAndUpdate(
      { _id: id, userId },
      { isDefault: true },
      { new: true }
    );

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    res.status(200).json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};