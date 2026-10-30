const mongoose = require('mongoose');
const Product = require('./models/Product');

// Apna MongoDB Atlas wala URL yahan daalein
mongoose.connect('YAHAN_APNA_MONGODB_URL_DAALEIN')
.then(async () => {
    console.log("Seeding products...");
    await Product.deleteMany({});
    
    const sampleProducts = [
        { modelName: "NanoMixer", serialNo: "NM1001" },
        { modelName: "NanoMixer", serialNo: "NM1002" },
        { modelName: "NanoCooker", serialNo: "NC2001" },
        { modelName: "NanoGrinder", serialNo: "NG3001" }
    ];

    await Product.insertMany(sampleProducts);
    console.log("✅ Saare 4 products database me save ho gaye!");
    process.exit();
});