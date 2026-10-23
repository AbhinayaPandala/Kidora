
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

async function addSampleProduct() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const product = await Product.create({
      name: "Soft Cotton Baby Romper",
      description: "Comfortable cotton romper for everyday baby wear.",
      category: "Clothing",
      price: 499,
      image: "",
      brand: "KIDORA",
      ageGroup: "0-12 months",
      stock: 25,
      featured: true
    });

    console.log("Sample product added successfully:");
    console.log(product);
  } catch (error) {
    console.error("Failed to add sample product:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

addSampleProduct();
