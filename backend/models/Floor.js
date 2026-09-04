const mongoose = require('mongoose');

const floorSchema = new mongoose.Schema({
  FloorID: { type: String, required: true, unique: true }, // e.g., "0", "1", "2"
  Name: { type: String, required: true }, // e.g., "Ground Floor"
  MapSVG: { type: String, default: 'map_ground.svg' } // The name of the SVG file in the frontend
}, { timestamps: true });

module.exports = mongoose.model('Floor', floorSchema);
