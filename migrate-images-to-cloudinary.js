require("dotenv").config();
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const Product = require("./models/Product");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function isLocalPath(str) {
  return str && !str.startsWith("http://") && !str.startsWith("https://");
}

async function uploadLocal(localPath) {
  const cleaned = localPath.replace(/^\//, "");
  const filePath = path.join(__dirname, cleaned.startsWith("uploads/") ? cleaned : `uploads/${cleaned}`);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  ملف مش موجود: ${filePath}`);
    return null;
  }
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "products",
    use_filename: true,
    unique_filename: true,
  });
  return result.secure_url;
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    const products = await Product.find({});
    let updated = 0;

    for (const product of products) {
      let changed = false;

      // Main image
      if (isLocalPath(product.image)) {
        console.log(`⬆️  رفع صورة رئيسية: ${product.image} (${product.name})`);
        const url = await uploadLocal(product.image);
        if (url) {
          product.image = url;
          changed = true;
          console.log(`✅ تم: ${url}`);
        }
      }

      // Gallery images
      if (product.images?.length) {
        for (let i = 0; i < product.images.length; i++) {
          if (isLocalPath(product.images[i])) {
            console.log(`⬆️  رفع صورة معرض [${i}]: ${product.images[i]}`);
            const url = await uploadLocal(product.images[i]);
            if (url) {
              product.images[i] = url;
              changed = true;
              console.log(`✅ تم: ${url}`);
            }
          }
        }
      }

      // Overview image
      if (isLocalPath(product.overviewImage)) {
        console.log(`⬆️  رفع صورة overview: ${product.overviewImage}`);
        const url = await uploadLocal(product.overviewImage);
        if (url) {
          product.overviewImage = url;
          changed = true;
        }
      }

      if (changed) {
        await product.save();
        updated++;
        console.log(`💾 تم تحديث: ${product.name}`);
      }
    }

    console.log(`\n🎉 تم تحديث ${updated} منتج من أصل ${products.length}`);
  } catch (err) {
    console.error("❌ خطأ:", err.message ?? err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
