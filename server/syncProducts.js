require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

async function syncProducts() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  // 1. Update Baby Gift Set
  await Product.findByIdAndUpdate("6adb037d83f792701ac8c0bd", {
    image: "/products/baby-gift-set.jpg"
  });

  // 2. Update Floral Baby Dress
  await Product.findByIdAndUpdate("6adb013b83f792701ac8c0b6", {
    image: "/products/floral-baby-dress.jpg",
    description: "Adorable floral print baby dress with ruffled sleeves made from soft, breathable cotton."
  });

  // 3. Update Soft Cotton Baby Romper
  await Product.findByIdAndUpdate("6adb00f583f792701ac8c0af", {
    image: "/products/soft-cotton-baby-romper.jpg"
  });

  // 4. Update the duplicate romper to Baby Jeans
  await Product.findByIdAndUpdate("6ad20f1abe6995c6c4464127", {
    name: "Baby Jeans",
    description: "Comfortable soft stretch denim baby jeans with gentle elastic waistband.",
    image: "/products/baby-jeans.jpg",
    category: "Clothing"
  });

  // 5. Update Centy Ambassador Toy Car
  await Product.findByIdAndUpdate("6ad382b343fa837aa149c682", {
    image: "/products/centy-ambassador-toy-car.jpg",
    description: "Classic Ambassador die-cast pull back toy car for kids."
  });

  // 6. Ensure Teddy Bear exists
  const existingTeddy = await Product.findOne({ name: "Teddy Bear" });
  if (!existingTeddy) {
    await Product.create({
      name: "Teddy Bear",
      description: "Ultra-soft cuddly plush teddy bear, perfect companion for little ones.",
      category: "Toys",
      price: 399,
      image: "/products/teddy-bear.jpg",
      brand: "KIDORA",
      ageGroup: "All ages",
      stock: 20,
      featured: true
    });
    console.log("Created Teddy Bear");
  } else {
    existingTeddy.image = "/products/teddy-bear.jpg";
    await existingTeddy.save();
    console.log("Updated Teddy Bear");
  }

  // 7. Ensure Baby Feeding Bottle exists
  const existingBottle = await Product.findOne({ name: "Baby Feeding Bottle" });
  if (!existingBottle) {
    await Product.create({
      name: "Baby Feeding Bottle",
      description: "Anti-colic easy-latch baby feeding bottle with clear measurement markings.",
      category: "Feeding",
      price: 349,
      image: "/products/baby-feeding-bottle.jpg",
      brand: "KIDORA",
      ageGroup: "0-12 months",
      stock: 35,
      featured: true
    });
    console.log("Created Baby Feeding Bottle");
  } else {
    existingBottle.image = "/products/baby-feeding-bottle.jpg";
    await existingBottle.save();
    console.log("Updated Baby Feeding Bottle");
  }

  // 8. Ensure Baby Blanket exists
  const existingBlanket = await Product.findOne({ name: "Baby Blanket" });
  if (!existingBlanket) {
    await Product.create({
      name: "Baby Blanket",
      description: "Ultra-soft knitted organic cotton baby blanket for warm and cozy sleep.",
      category: "Nursery",
      price: 599,
      image: "/products/baby-blanket.jpg",
      brand: "KIDORA",
      ageGroup: "All ages",
      stock: 18,
      featured: true
    });
    console.log("Created Baby Blanket");
  } else {
    existingBlanket.image = "/products/baby-blanket.jpg";
    await existingBlanket.save();
    console.log("Updated Baby Blanket");
  }

  const all = await Product.find({}).sort({ createdAt: 1 });
  console.log("Final Products count:", all.length);
  for (const p of all) {
    console.log(`- [${p.category}] ${p.name}: image='${p.image}', price=₹${p.price}, stock=${p.stock}`);
  }

  await mongoose.disconnect();
}

syncProducts().catch((err) => {
  console.error("Sync error:", err);
  process.exit(1);
});
