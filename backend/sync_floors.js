const mongoose = require('mongoose');
const Floor = require('./models/Floor');
require('dotenv').config();

async function syncFloors() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-navigation');
    
    // Wipe old SVG floors
    await Floor.deleteMany({});
    
    // Create new GLB floors
    await Floor.create([
      { FloorID: '-1', Name: 'Ground Floor (Ramanujan)', MapSVG: 'ground.glb' },
      { FloorID: '0', Name: 'First Floor (Ramanujan)', MapSVG: 'first.glb' },
      { FloorID: '1', Name: 'Second Floor (Ramanujan)', MapSVG: 'second.glb' }
    ]);
    
    console.log('Synced Floors to DB!');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

syncFloors();
