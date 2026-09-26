const mongoose = require('mongoose');
const Node = require('./models/Node');
require('dotenv').config();

const updates = [
  // TOP ROW (Y=400)
  { id: 'RAM-F1-01', X: 250, Y: 400 }, // Fire Exit
  { id: 'RAM-F1-02', X: 300, Y: 400 }, // Ladies Toilet
  { id: 'RAM-F1-03', X: 450, Y: 400 }, // Electrical Dept
  { id: 'RAM-F1-04', X: 600, Y: 400 }, // Class Room 4
  { id: 'RAM-F1-05', X: 750, Y: 400 }, // Class Room 5
  { id: 'RAM-F1-06', X: 850, Y: 400 }, // Project Lab
  { id: 'RAM-F1-07', X: 1000, Y: 400 }, // Power System Lab
  { id: 'RAM-F1-08', X: 1100, Y: 400 }, // Research Lab
  { id: 'RAM-F1-09', X: 1200, Y: 400 }, // Siemens Lab
  { id: 'RAM-F1-10', X: 1350, Y: 400 }, // Conference
  { id: 'RAM-F1-11', X: 1550, Y: 400 }, // Class 11
  { id: 'RAM-F1-12', X: 1700, Y: 400 }, // Gents Toilet

  // RIGHT EDGE
  { id: 'RAM-F1-13', X: 1700, Y: 600 }, // Lift 1
  { id: 'RAM-F1-14', X: 1600, Y: 650 }, // Staircase 1
  { id: 'RAM-F1-15', X: 1400, Y: 650 }, // Common Computing
  { id: 'RAM-F1-16', X: 1200, Y: 650 }, // System Admin
  { id: 'RAM-F1-17', X: 1100, Y: 650 }, // Server
  { id: 'RAM-F1-18', X: 1000, Y: 650 }, // Construction

  // BOTTOM MIDDLE
  { id: 'RAM-F1-19', X: 900, Y: 650 }, // Interview Room
  { id: 'RAM-F1-20', X: 650, Y: 650 }, // Placement
  { id: 'RAM-F1-21', X: 750, Y: 650 }, // Counselor
  { id: 'RAM-F1-22', X: 800, Y: 650 }, // Waiting

  // BOTTOM LEFT
  { id: 'RAM-F1-23', X: 550, Y: 650 }, // Lift 2
  { id: 'RAM-F1-24', X: 500, Y: 650 }, // Staircase 2
  { id: 'RAM-F1-25', X: 450, Y: 650 }, // Electrical Room
  
  // FAR LEFT
  { id: 'RAM-F1-26', X: 200, Y: 500 }, // Toilet Handicapped
  { id: 'RAM-F1-27', X: 850, Y: 540 }  // Passage (Middle)
];

async function align() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-navigation');
    for (const room of updates) {
      await Node.findOneAndUpdate(
        { NodeID: room.id },
        { $set: { X: room.X, Y: room.Y } }
      );
    }
    console.log('Aligned 27 nodes to approximate blueprint layout!');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

align();
