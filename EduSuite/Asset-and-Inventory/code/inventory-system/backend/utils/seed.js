// Seeds the database with a demo Admin user, categories, vendors and products.
// Run with: npm run seed
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const User = require("../models/User");
const Category = require("../models/Category");
const Vendor = require("../models/Vendor");
const Product = require("../models/Product");

const run = async () => {
  await connectDB();

  console.log("Clearing existing demo collections...");
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Vendor.deleteMany({}),
    Product.deleteMany({}),
  ]);

  console.log("Creating admin user...");
  await User.create({
    name: "Jatin Chaudhary",
    email: "admin@inventory.com",
    password: "admin123",
    role: "Admin",
    phone: "9999999999",
  });

  console.log("Creating categories...");
  const categories = await Category.insertMany([
    { name: "Electronics", description: "Laptops, printers, cables and accessories" },
    { name: "Furniture", description: "Office chairs, desks and cabinets" },
    { name: "Stationary", description: "Paper, pens and office supplies" },
    { name: "Lab Equipment", description: "Lab and seminar hall equipment" },
  ]);
  const [electronics, furniture, stationary, lab] = categories;

  console.log("Creating vendors...");
  const vendors = await Vendor.insertMany([
    {
      companyName: "Dell Technologies",
      contactPerson: "Rahul Verma",
      email: "sales@dell.example.com",
      phone: "9876543210",
      gstNumber: "07AAACD1234F1Z5",
      address: "Sector 18, Gurugram, Haryana",
    },
    {
      companyName: "Office Comforts",
      contactPerson: "Priya Sharma",
      email: "contact@officecomforts.example.com",
      phone: "9123456780",
      gstNumber: "06AAACO5678G1Z2",
      address: "Industrial Area, Ludhiana, Punjab",
    },
  ]);
  const [dell, officeComforts] = vendors;

  console.log("Creating products...");
  await Product.insertMany([
    {
      name: "HP Laptop 15s",
      category: electronics._id,
      brand: "HP",
      model: "15s-fq5007TU",
      sku: "HP15S-001",
      purchasePrice: 42000,
      sellingPrice: 45000,
      quantity: 25,
      minStock: 10,
      location: "Store Room A",
    },
    {
      name: "Canon Printer G2010",
      category: electronics._id,
      brand: "Canon",
      model: "G2010",
      sku: "CAN-G2010",
      purchasePrice: 11000,
      sellingPrice: 12500,
      quantity: 8,
      minStock: 10,
      location: "Store Room A",
    },
    {
      name: "Office Chair",
      category: furniture._id,
      brand: "Featherlite",
      model: "Ergo-200",
      sku: "CHR-001",
      purchasePrice: 2800,
      sellingPrice: 3200,
      quantity: 15,
      minStock: 5,
      location: "Store Room B",
    },
    {
      name: "Wireless Mouse",
      category: electronics._id,
      brand: "Logitech",
      model: "M235",
      sku: "WM-101",
      purchasePrice: 380,
      sellingPrice: 450,
      quantity: 5,
      minStock: 10,
      location: "Store Room A",
    },
    {
      name: "A4 Paper Ream",
      category: stationary._id,
      brand: "JK",
      model: "Copier Paper",
      sku: "APR-001",
      purchasePrice: 180,
      sellingPrice: 210,
      quantity: 8,
      minStock: 20,
      location: "Store Room C",
    },
    {
      name: "Projector Epson",
      category: lab._id,
      brand: "Epson",
      model: "EB-X06",
      sku: "EP-2050",
      purchasePrice: 48000,
      sellingPrice: 54000,
      quantity: 0,
      minStock: 2,
      location: "Seminar Hall Store",
    },
  ]);

  console.log("Seed complete.");
  console.log("Login with: admin@inventory.com / admin123");
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
