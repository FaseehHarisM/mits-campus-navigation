const mongoose = require('mongoose');
const Node = require('./models/Node');
require('dotenv').config();

const rooms = [
  // Top Row (Left to Right)
  { id: 'RAM-G-21', Name: 'GENTS TOILET', Type: 'Washroom', X: 250, Y: 400 },
  { id: 'RAM-G-20', Name: 'GEOTECHNICAL ENG LAB', Type: 'Lab', X: 500, Y: 400 },
  { id: 'RAM-G-19', Name: 'CONCRETE LABORATORY', Type: 'Lab', X: 750, Y: 400 },
  { id: 'RAM-G-18', Name: 'ELECTRICAL WORKSHOP', Type: 'Lab', X: 1000, Y: 400 },
  { id: 'RAM-G-17', Name: 'CAFFETERIA 1', Type: 'Cafeteria', X: 1200, Y: 400 },
  { id: 'RAM-G-16', Name: 'HOUSE KEEPING STAFF', Type: 'Room', X: 1400, Y: 400 },
  { id: 'RAM-G-14', Name: 'STORE', Type: 'Room', X: 1550, Y: 400 },
  { id: 'RAM-G-13', Name: 'CAFETTERIA 2', Type: 'Cafeteria', X: 1700, Y: 400 },

  // Middle Area
  { id: 'RAM-G-04', Name: 'PASSAGE', Type: 'Junction', X: 400, Y: 500 },
  { id: 'RAM-G-24', Name: 'ELECTRICAL ROOM', Type: 'Office', X: 600, Y: 500 },
  { id: 'RAM-G-03', Name: 'RECEPTION', Type: 'Room', X: 900, Y: 500 },
  { id: 'RAM-G-02', Name: 'LOBBY', Type: 'Junction', X: 800, Y: 550 },
  { id: 'RAM-G-01', Name: 'ENTRANCE', Type: 'Elevator', X: 700, Y: 600 },
  { id: 'RAM-G-15', Name: 'MAINTENANCE & ELEC', Type: 'Office', X: 1300, Y: 500 },

  // Far Left
  { id: 'RAM-G-22', Name: 'FIRE EXIT', Type: 'Stairs', X: 200, Y: 450 },
  { id: 'RAM-G-23', Name: 'TOILET FOR HANDICAPED', Type: 'Washroom', X: 200, Y: 500 },
  { id: 'RAM-G-25', Name: 'STAIRCASE 2', Type: 'Stairs', X: 600, Y: 550 },
  { id: 'RAM-G-26', Name: 'LIFT 2', Type: 'Elevator', X: 600, Y: 600 },

  // Bottom Row
  { id: 'RAM-G-05', Name: 'SICK ROOM', Type: 'Room', X: 700, Y: 650 },
  { id: 'RAM-G-06', Name: 'DOCTTORS ROOM', Type: 'Office', X: 800, Y: 650 },
  { id: 'RAM-G-07', Name: 'PHYSICAL EDUCATION DIR', Type: 'Office', X: 900, Y: 650 },
  { id: 'RAM-G-08', Name: 'ELECTRICALLAB', Type: 'Lab', X: 1050, Y: 650 },
  { id: 'RAM-G-10', Name: 'NSS ROOM', Type: 'Room', X: 1300, Y: 650 },
  { id: 'RAM-G-09', Name: 'CAFFETERIA 3', Type: 'Cafeteria', X: 1450, Y: 650 },
  { id: 'RAM-G-11', Name: 'STAIRCASE 1', Type: 'Stairs', X: 1600, Y: 650 },
  { id: 'RAM-G-12', Name: 'LIFT 1', Type: 'Elevator', X: 1700, Y: 650 }
];

async function seedG() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-navigation');
    
    // Clear out any dummy nodes for Ground floor if needed, but we'll just upsert
    for (const room of rooms) {
      await Node.findOneAndUpdate(
        { NodeID: room.id },
        {
          NodeID: room.id,
          Name: room.Name,
          Type: room.Type,
          Floor: '-1', // Ground floor maps to '-1'
          FloorID: 'Ground Floor',
          X: room.X,
          Y: room.Y
        },
        { upsert: true, new: true }
      );
    }
    console.log('Seeded and aligned 26 nodes for Ground Floor!');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

seedG();
