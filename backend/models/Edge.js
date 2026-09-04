const mongoose = require('mongoose');

const edgeSchema = new mongoose.Schema({
  EdgeID: { type: String, required: true, unique: true },
  StartNodeID: { type: String, required: true },
  EndNodeID: { type: String, required: true },
  Distance: { type: Number, required: true },
  EdgeType: { type: String, enum: ['walkway', 'stairs', 'elevator'], default: 'walkway' }
}, { timestamps: true });

module.exports = mongoose.model('Edge', edgeSchema);
