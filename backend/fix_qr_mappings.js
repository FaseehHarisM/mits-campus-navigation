const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const QRCode = require('./models/QRCode');
const Node = require('./models/Node');

async function fixQRs() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-navigation');
  console.log('Connected to MongoDB');

  // 1. Delete broken QRs whose NodeID does not exist
  const allQRs = await QRCode.find({});
  let deleted = 0;
  for (const qr of allQRs) {
    const exists = await Node.findOne({ NodeID: qr.NodeID });
    if (!exists) {
      await QRCode.deleteOne({ _id: qr._id });
      console.log('Deleted broken legacy QR mapping:', qr.QRID, '->', qr.NodeID);
      deleted++;
    }
  }

  // 2. Ensure all real rooms and facilities have valid QR codes
  const prominentNodes = await Node.find({ Type: { $ne: 'Junction' } });
  console.log('Total real rooms/facilities found:', prominentNodes.length);

  for (let i = 0; i < prominentNodes.length; i++) {
    const n = prominentNodes[i];
    const qrId = `QR_${n.NodeID}`;
    await QRCode.findOneAndUpdate(
      { NodeID: n.NodeID },
      { QRID: qrId, NodeID: n.NodeID },
      { upsert: true, new: true }
    );
  }

  // 3. Ensure classic short QR IDs (QR001 - QR005) map to key locations
  const defaultMaps = [
    { QRID: 'QR001', NodeID: 'RAM-G-03' },  // Reception (Ground Floor)
    { QRID: 'QR002', NodeID: 'RAM-F2-18' }, // Computer Science Dept (2nd Floor)
    { QRID: 'QR003', NodeID: 'RAM-F1-03' }, // Electrical & Electronics Dept (1st Floor)
    { QRID: 'QR004', NodeID: 'RAM-F1-15' }, // Common Computing Facility 1 (1st Floor)
    { QRID: 'QR005', NodeID: 'RAM-G-17' }, // Cafeteria (Ground Floor)
  ];

  for (const dm of defaultMaps) {
    await QRCode.findOneAndUpdate(
      { QRID: dm.QRID },
      { QRID: dm.QRID, NodeID: dm.NodeID },
      { upsert: true, new: true }
    );
    console.log(`Verified mapping: ${dm.QRID} -> ${dm.NodeID}`);
  }

  const finalCount = await QRCode.countDocuments();
  console.log(`Total valid QR codes in database: ${finalCount}`);
  process.exit(0);
}

fixQRs().catch(err => {
  console.error('Error fixing QR mappings:', err);
  process.exit(1);
});
