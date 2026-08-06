const asyncHandler = require("express-async-handler");
const Vendor = require("../models/Vendor");
const Purchase = require("../models/Purchase");

const getVendors = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = search
    ? {
        $or: [
          { companyName: { $regex: search, $options: "i" } },
          { contactPerson: { $regex: search, $options: "i" } },
        ],
      }
    : {};
  const vendors = await Vendor.find(filter).sort({ companyName: 1 });
  res.json(vendors);
});

const getVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    res.status(404);
    throw new Error("Vendor not found");
  }
  res.json(vendor);
});

const getVendorPurchaseHistory = asyncHandler(async (req, res) => {
  const purchases = await Purchase.find({ vendor: req.params.id })
    .populate("items.product", "name sku")
    .sort({ purchaseDate: -1 });
  res.json(purchases);
});

const createVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.create(req.body);
  res.status(201).json(vendor);
});

const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    res.status(404);
    throw new Error("Vendor not found");
  }
  Object.assign(vendor, req.body);
  const updated = await vendor.save();
  res.json(updated);
});

const deleteVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    res.status(404);
    throw new Error("Vendor not found");
  }
  await vendor.deleteOne();
  res.json({ message: "Vendor removed" });
});

module.exports = {
  getVendors,
  getVendor,
  getVendorPurchaseHistory,
  createVendor,
  updateVendor,
  deleteVendor,
};
