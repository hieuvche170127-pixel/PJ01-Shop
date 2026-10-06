const Voucher = require('../models/Voucher');

// @desc    Create a new voucher
// @route   POST /api/vouchers
// @access  Private/Admin
const createVoucher = async (req, res, next) => {
  try {
    const { code, discount, expirationDate, minOrderValue, usageLimit, maxDiscount } = req.body;

    const voucher = new Voucher({
      code,
      discount,
      expirationDate,
      minOrderValue,
      usageLimit,
      maxDiscount,
    });

    const createdVoucher = await voucher.save();
    res.status(201).json(createdVoucher);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all vouchers
// @route   GET /api/vouchers
// @access  Private/Admin
const getVouchers = async (req, res, next) => {
  try {
    const vouchers = await Voucher.find({});
    res.json(vouchers);
  } catch (error) {
    next(error);
  }
};

// @desc    Get voucher by ID
// @route   GET /api/vouchers/:id
// @access  Private/Admin
const getVoucherById = async (req, res, next) => {
  try {
    const voucher = await Voucher.findById(req.params.id);

    if (voucher) {
      res.json(voucher);
    } else {
      res.status(404).json({ message: 'Voucher not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update a voucher
// @route   PUT /api/vouchers/:id
// @access  Private/Admin
const updateVoucher = async (req, res, next) => {
  try {
    const { code, discount, expirationDate, minOrderValue, usageLimit, maxDiscount, isActive } = req.body;

    const voucher = await Voucher.findById(req.params.id);

    if (voucher) {
      voucher.code = code || voucher.code;
      voucher.discount = discount || voucher.discount;
      voucher.expirationDate = expirationDate || voucher.expirationDate;
      voucher.minOrderValue = minOrderValue || voucher.minOrderValue;
      voucher.usageLimit = usageLimit || voucher.usageLimit;
      voucher.maxDiscount = maxDiscount || voucher.maxDiscount;
      voucher.isActive = isActive !== undefined ? isActive : voucher.isActive;

      const updatedVoucher = await voucher.save();
      res.json(updatedVoucher);
    } else {
      res.status(404).json({ message: 'Voucher not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a voucher
// @route   DELETE /api/vouchers/:id
// @access  Private/Admin
const deleteVoucher = async (req, res, next) => {
  try {
    const voucher = await Voucher.findById(req.params.id);

    if (voucher) {
      await voucher.remove();
      res.json({ message: 'Voucher removed' });
    } else {
      res.status(404).json({ message: 'Voucher not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle voucher active status
// @route   PUT /api/vouchers/:id/toggle-active
// @access  Private/Admin
const toggleVoucherActive = async (req, res, next) => {
  try {
    const voucher = await Voucher.findById(req.params.id);

    if (voucher) {
      voucher.isActive = !voucher.isActive;
      const updatedVoucher = await voucher.save();
      res.json(updatedVoucher);
    } else {
      res.status(404).json({ message: 'Voucher not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Tìm kiếm voucher theo mã code
// @route   GET /api/vouchers/code/:code
// @access  Private/Admin
const getVoucherByCode = async (req, res, next) => {
  try {
    const code = req.params.code;
    const now = new Date();

    // Tìm voucher trong cơ sở dữ liệu
    const voucher = await Voucher.findOne({ code });

    // Kiểm tra kết quả
    if (!voucher) {
      return res.status(404).json({ message: 'Không tìm thấy voucher' });
    }

    // Kiểm tra điều kiện sử dụng
    if (!voucher.isActive) {
      return res.status(400).json({ message: 'Voucher đã hết hạn hoặc hết lượt sử dụng' });
    }

    if (voucher.expirationDate < now) {
      return res.status(400).json({ message: 'Voucher đã hết hạn' });
    }

    if (voucher.usedCount >= voucher.usageLimit) {
      return res.status(400).json({ message: 'Voucher đã hết lượt sử dụng' });
    }

    res.json(voucher);
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createVoucher,
  getVouchers,
  getVoucherById,
  updateVoucher,
  deleteVoucher,
  toggleVoucherActive,
  getVoucherByCode, // Thêm hàm mới vào đây
  
};