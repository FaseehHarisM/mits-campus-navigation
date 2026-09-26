const mongoose = require('mongoose');
const Node = require('./models/Node');
require('dotenv').config();

async function updateIcons() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-navigation');
    console.log('Connected to DB');
    
    // Update Classrooms
    await Node.updateMany(
      { Name: /CLASS ROOM/i },
      { $set: { Type: 'Classroom' } }
    );
    
    // Update Labs
    await Node.updateMany(
      { Name: /LAB/i },
      { $set: { Type: 'Lab' } }
    );
    
    // Update Server Room
    await Node.updateMany(
      { Name: /SERVER/i },
      { $set: { Type: 'Server' } }
    );

    console.log('Updated Node Types for new icons!');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

updateIcons();
