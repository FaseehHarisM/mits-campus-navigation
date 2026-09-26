const mongoose = require('mongoose');
const Node = require('./models/Node');
require('dotenv').config();

const rooms = [
  // Top Row (Left to Right)
  { id: 'RAM-F2-01', Name: 'FIRE EXIT', Type: 'Stairs', X: 250, Y: 400 },
  { id: 'RAM-F2-02', Name: 'LADIES TOILET', Type: 'Washroom', X: 300, Y: 400 },
  { id: 'RAM-F2-03', Name: 'MAINTENANCE & STORAGE', Type: 'Room', X: 450, Y: 400 },
  { id: 'RAM-F2-04', Name: 'TUTORIAL ROOM', Type: 'Classroom', X: 600, Y: 400 },
  { id: 'RAM-F2-05', Name: 'EEE LIBRARY', Type: 'Library', X: 750, Y: 400 },
  { id: 'RAM-F2-06', Name: 'POWER ELECTRONICS LAB', Type: 'Lab', X: 850, Y: 400 },
  { id: 'RAM-F2-07', Name: 'MICHEAL FARADAY HALL', Type: 'Hall', X: 1000, Y: 400 },
  { id: 'RAM-F2-08', Name: 'ELECTRICAL MEASUREMENTS LAB', Type: 'Lab', X: 1150, Y: 400 },
  { id: 'RAM-F2-09', Name: 'STEEVE JOBS SEMINAR HALL', Type: 'Hall', X: 1350, Y: 400 },
  { id: 'RAM-F2-10', Name: 'M.TECH CLASS ROOM', Type: 'Classroom', X: 1550, Y: 400 },
  { id: 'RAM-F2-11', Name: 'CODD BASE LAB', Type: 'Lab', X: 1650, Y: 400 },
  { id: 'RAM-F2-12', Name: 'GENTS TOILET', Type: 'Washroom', X: 1750, Y: 400 },

  // Bottom Row (Right to Left)
  { id: 'RAM-F2-13', Name: 'LIFT 1', Type: 'Elevator', X: 1700, Y: 600 },
  { id: 'RAM-F2-14', Name: 'STAIRCASE 1', Type: 'Stairs', X: 1600, Y: 650 },
  { id: 'RAM-F2-15', Name: 'CEASER LAB', Type: 'Lab', X: 1400, Y: 650 },
  { id: 'RAM-F2-16', Name: 'GRACE HOPPER LAB', Type: 'Lab', X: 1200, Y: 650 },
  { id: 'RAM-F2-17', Name: 'TURING LAB', Type: 'Lab', X: 1000, Y: 650 },
  { id: 'RAM-F2-18', Name: 'COMPUTER SCIENCE DEPT', Type: 'Office', X: 800, Y: 650 },
  { id: 'RAM-F2-19', Name: 'LIFT 2', Type: 'Elevator', X: 550, Y: 650 },
  { id: 'RAM-F2-20', Name: 'STAIRCASE 2', Type: 'Stairs', X: 500, Y: 650 },
  { id: 'RAM-F2-21', Name: 'ELECTRICAL ROOM', Type: 'Office', X: 450, Y: 650 },
  { id: 'RAM-F2-22', Name: 'PASSAGE', Type: 'Junction', X: 850, Y: 540 }
];

async function seedF2() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-navigation');
    
    for (const room of rooms) {
      await Node.findOneAndUpdate(
        { NodeID: room.id },
        {
          NodeID: room.id,
          Name: room.Name,
          Type: room.Type,
          Floor: '1', // F2 maps to activeFloor '1'
          FloorID: 'Second Floor',
          X: room.X,
          Y: room.Y
        },
        { upsert: true, new: true }
      );
    }
    console.log('Seeded and aligned 22 nodes for Second Floor!');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

seedF2();
