const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
  QRID: { type: String, required: true, unique: true },
  NodeID: { type: String, required: true } // The node this QR code is physically located at
}, { timestamps: true });

module.exports = mongoose.model('QRCode', qrCodeSchema);
