require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");
const products = require("./new-products.js");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    let updated = 0;
    for (const product of products) {
      if (!product.overviewImage) continue;
      const result = await Product.findByIdAndUpdate(product._id, {
        overviewImage: product.overviewImage,
      });
      if (result) {
        console.log(`✅ تم تحديث: ${product.name}`);
        updated++;
      } else {
        console.log(`⚠️ مش موجود: ${product.name}`);
      }
    }

    console.log(`\n🎉 تم تحديث ${updated} منتج!`);
  } catch (err) {
    console.error("❌ خطأ:", err.message ?? err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
