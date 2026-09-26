const mongoose = require('mongoose');
const Node = require('./models/Node');
require('dotenv').config();

const updates = [
  { id: 'RAM-F2-18', X: 1102, Y: 644 },
  { id: 'RAM-F2-17', X: 1496, Y: 602 },
  { id: 'RAM-F2-16', X: 1935, Y: 650 },
  { id: 'RAM-F2-15', X: 2285, Y: 652 },
  { id: 'RAM-F2-14', X: 2627, Y: 528 },
  { id: 'RAM-F2-13', X: 2697, Y: 316 },
  { id: 'RAM-F2-12', X: 2622, Y: -13 }
];

async function updateCoordinates() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-navigation');
    for (const room of updates) {
      await Node.findOneAndUpdate(
        { NodeID: room.id },
        { $set: { X: room.X, Y: room.Y } }
      );
    }
    console.log('Successfully updated 7 coordinates for F2!');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

updateCoordinates();
