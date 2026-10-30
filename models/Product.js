const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    modelName: { type: String, required: true },
    serialNo: { type: String, required: true, unique: true },
    isRegistered: { type: Boolean, default: false },
    customerPhone: { type: String, default: null },
    warrantyExpiryDate: { type: Date, default: null }
});

module.exports = mongoose.model('Product', productSchema);