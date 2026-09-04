const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  Name: { type: String, required: true },
  Department: { type: String, required: true },
  RoomNodeID: { type: String, required: true }, // The NodeID of their office/room
  Designation: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Faculty', facultySchema);
