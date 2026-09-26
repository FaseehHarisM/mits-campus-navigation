const mongoose = require('mongoose');
const Node = require('./models/Node');
require('dotenv').config();

const rooms = [
  { id: 'RAM-F1-01', Name: 'FIRE EXIT', Type: 'Stairs', X: 100, Y: 100 },
  { id: 'RAM-F1-02', Name: 'LADIES TOILET', Type: 'Washroom', X: 200, Y: 100 },
  { id: 'RAM-F1-03', Name: 'ELECTRICAL & ELECTRONICS DEPARTMENT', Type: 'Office', X: 300, Y: 100 },
  { id: 'RAM-F1-04', Name: 'CLASS ROOM (4)', Type: 'Room', X: 400, Y: 100 },
  { id: 'RAM-F1-05', Name: 'CLASS ROOM (5)', Type: 'Room', X: 500, Y: 100 },
  { id: 'RAM-F1-06', Name: 'PROJECT LAB', Type: 'Room', X: 600, Y: 100 },
  { id: 'RAM-F1-07', Name: 'POWER SYSTEM LAB', Type: 'Room', X: 700, Y: 100 },
  { id: 'RAM-F1-08', Name: 'RESEARCH LAB', Type: 'Room', X: 800, Y: 100 },
  { id: 'RAM-F1-09', Name: 'SIEMENS LAB', Type: 'Room', X: 900, Y: 100 },
  { id: 'RAM-F1-10', Name: 'CONFERENCE ROOM', Type: 'Office', X: 1000, Y: 100 },
  { id: 'RAM-F1-11', Name: 'CLASS ROOM (11)', Type: 'Room', X: 1100, Y: 100 },
  { id: 'RAM-F1-12', Name: 'GENTS TOILET', Type: 'Washroom', X: 1200, Y: 100 },
  { id: 'RAM-F1-13', Name: 'LIFT 1', Type: 'Elevator', X: 1300, Y: 100 },
  { id: 'RAM-F1-14', Name: 'STAIRCASE 1', Type: 'Stairs', X: 1400, Y: 100 },
  { id: 'RAM-F1-15', Name: 'COMMON COMPUTING FACILITY 1', Type: 'Room', X: 1500, Y: 100 },
  { id: 'RAM-F1-16', Name: 'SYSTEM ADMIN ROOM', Type: 'Office', X: 1600, Y: 100 },
  { id: 'RAM-F1-17', Name: 'SERVER ROOM', Type: 'Office', X: 1700, Y: 100 },
  { id: 'RAM-F1-18', Name: 'CONSTRUCTION & MAINTENANCE CELL', Type: 'Office', X: 100, Y: 200 },
  { id: 'RAM-F1-19', Name: 'INTERVIEW ROOM', Type: 'Office', X: 200, Y: 200 },
  { id: 'RAM-F1-20', Name: 'PLACEMENT CELL', Type: 'Office', X: 300, Y: 200 },
  { id: 'RAM-F1-21', Name: 'COUNSELOR ROOM', Type: 'Office', X: 400, Y: 200 },
  { id: 'RAM-F1-22', Name: 'WAITING ROOM', Type: 'Office', X: 500, Y: 200 },
  { id: 'RAM-F1-23', Name: 'LIFT 2', Type: 'Elevator', X: 600, Y: 200 },
  { id: 'RAM-F1-24', Name: 'STAIRCASE 2', Type: 'Stairs', X: 700, Y: 200 },
  { id: 'RAM-F1-25', Name: 'ELECTRICAL ROOM', Type: 'Office', X: 800, Y: 200 },
  { id: 'RAM-F1-26', Name: 'TOILET FOR HANDICAPPED', Type: 'Washroom', X: 900, Y: 200 },
  { id: 'RAM-F1-27', Name: 'PASSAGE', Type: 'Junction', X: 1000, Y: 200 }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-navigation');
    console.log('Connected to DB');
    
    // Delete existing old nodes for floor 1 (or we can just wipe all of F1 for this block)
    // To be safe, we'll just insert/update these specific ones
    
    for (const room of rooms) {
      await Node.findOneAndUpdate(
        { NodeID: room.id },
        {
          NodeID: room.id,
          Name: room.Name,
          Type: room.Type,
          Floor: '1',
          FloorID: 'First Floor',
          X: room.X,
          Y: room.Y
        },
        { upsert: true, new: true }
      );
    }
    console.log('Inserted 27 new nodes perfectly!');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

seed();
