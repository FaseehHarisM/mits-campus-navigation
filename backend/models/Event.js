const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  Title: { type: String, required: true },
  VenueNodeID: { type: String, required: true }, // The NodeID of the venue
  StartTime: { type: Date, required: true },
  EndTime: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
