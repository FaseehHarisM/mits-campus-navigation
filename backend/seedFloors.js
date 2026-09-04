const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Floor = require('./models/Floor');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/CampusNavigation').then(async () => {
  console.log('Connected to DB');
  await Floor.deleteMany({});
  
  await Floor.create([
    { FloorID: '-1', Name: 'Lower Ground (Basement)', MapSVG: 'map_lg.svg' },
    { FloorID: '0', Name: 'Ground Floor', MapSVG: 'map_ground.svg' },
    { FloorID: '1', Name: 'First Floor', MapSVG: 'map_first.svg' }
  ]);
  
  console.log('Successfully seeded 3 floors!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
