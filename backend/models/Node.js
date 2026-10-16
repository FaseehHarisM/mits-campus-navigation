const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  NodeID: { type: String, required: true, unique: true },
  Name: { type: String, required: true },
  Type: { type: String, required: true },
  Floor: { type: String, required: true, default: '0' },
  X: { type: Number, required: true },
  Y: { type: Number, required: true },
  FloorID: { type: String, default: 'Ground' },
  RoomNodeID: { type: String, default: null },
  DoorNodeID: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Node', nodeSchema);
