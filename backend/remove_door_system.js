const mongoose = require('mongoose');
require('dotenv').config();

const Node = require('./models/Node');
const Edge = require('./models/Edge');

function calcDist(x1, y1, x2, y2) {
  return Math.round(Math.hypot(x2 - x1, y2 - y1));
}

async function removeDoorSystem() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-navigation');
    console.log('Connected to MongoDB');

    // 1. Delete all Door nodes
    const delNodes = await Node.deleteMany({
      $or: [
        { Type: 'Door' },
        { NodeID: { $regex: 'DOOR', $options: 'i' } }
      ]
    });
    console.log(`Deleted ${delNodes.deletedCount} Door nodes.`);

    // 2. Clear DoorNodeID and RoomNodeID fields
    await Node.updateMany({}, { $set: { DoorNodeID: null, RoomNodeID: null } });
    console.log('Reset DoorNodeID and RoomNodeID on all nodes.');

    // 3. Delete all edges referencing DOOR or door_connection
    const delEdges = await Edge.deleteMany({
      $or: [
        { EdgeType: 'door_connection' },
        { StartNodeID: { $regex: 'DOOR', $options: 'i' } },
        { EndNodeID: { $regex: 'DOOR', $options: 'i' } }
      ]
    });
    console.log(`Deleted ${delEdges.deletedCount} Door-related edges.`);

    // 4. Create direct, lightweight walkway edges connecting Floor 0 rooms
    const northChain = [
      'RAM-F1-02', 'RAM-F1-03', 'RAM-F1-04', 'RAM-F1-05', 'RAM-F1-06',
      'RAM-F1-07', 'RAM-F1-08', 'RAM-F1-09', 'RAM-F1-10', 'RAM-F1-11', 'RAM-F1-12'
    ];
    const eastChain = ['RAM-F1-12', 'RAM-F1-13', 'RAM-F1-15', 'RAM-F1-14'];
    const southChain = [
      'RAM-F1-15', 'RAM-F1-16', 'RAM-F1-17', 'RAM-F1-18', 'RAM-F1-19',
      'RAM-F1-22', 'RAM-F1-21', 'RAM-F1-20', 'RAM-F1-23', 'RAM-F1-24'
    ];
    const westChain = ['RAM-F1-24', 'RAM-F1-25', 'RAM-F1-26', 'RAM-F1-01', 'RAM-F1-02'];

    const allDbNodes = await Node.find({ Floor: '0' });
    const nodesMap = new Map();
    allDbNodes.forEach(n => nodesMap.set(n.NodeID, n));

    async function addWalkway(nodeA, nodeB) {
      const na = nodesMap.get(nodeA);
      const nb = nodesMap.get(nodeB);
      if (!na || !nb) return;
      const dist = calcDist(na.X, na.Y, nb.X, nb.Y);
      const edgeId = `E_F0_${nodeA}_${nodeB}`;
      await Edge.findOneAndUpdate(
        { EdgeID: edgeId },
        {
          EdgeID: edgeId,
          StartNodeID: nodeA,
          EndNodeID: nodeB,
          Distance: dist,
          EdgeType: 'walkway'
        },
        { upsert: true, new: true }
      );
    }

    for (let i = 0; i < northChain.length - 1; i++) {
      await addWalkway(northChain[i], northChain[i + 1]);
    }
    for (let i = 0; i < eastChain.length - 1; i++) {
      await addWalkway(eastChain[i], eastChain[i + 1]);
    }
    for (let i = 0; i < southChain.length - 1; i++) {
      await addWalkway(southChain[i], southChain[i + 1]);
    }
    for (let i = 0; i < westChain.length - 1; i++) {
      await addWalkway(westChain[i], westChain[i + 1]);
    }

    // Inter-floor connections for stairs and lifts
    await Edge.findOneAndUpdate(
      { EdgeID: 'ESTAIR_F0_F1_1' },
      { EdgeID: 'ESTAIR_F0_F1_1', StartNodeID: 'RAM-F1-14', EndNodeID: 'RAM-F2-14', Distance: 80, EdgeType: 'stairs' },
      { upsert: true, new: true }
    );
    await Edge.findOneAndUpdate(
      { EdgeID: 'ESTAIR_F0_G_1' },
      { EdgeID: 'ESTAIR_F0_G_1', StartNodeID: 'RAM-F1-14', EndNodeID: 'RAM-G-11', Distance: 80, EdgeType: 'stairs' },
      { upsert: true, new: true }
    );
    await Edge.findOneAndUpdate(
      { EdgeID: 'ESTAIR_F0_F1_2' },
      { EdgeID: 'ESTAIR_F0_F1_2', StartNodeID: 'RAM-F1-24', EndNodeID: 'RAM-F2-20', Distance: 80, EdgeType: 'stairs' },
      { upsert: true, new: true }
    );
    await Edge.findOneAndUpdate(
      { EdgeID: 'ESTAIR_F0_G_2' },
      { EdgeID: 'ESTAIR_F0_G_2', StartNodeID: 'RAM-F1-24', EndNodeID: 'RAM-G-25', Distance: 80, EdgeType: 'stairs' },
      { upsert: true, new: true }
    );
    await Edge.findOneAndUpdate(
      { EdgeID: 'ELIFT_F0_F1_1' },
      { EdgeID: 'ELIFT_F0_F1_1', StartNodeID: 'RAM-F1-13', EndNodeID: 'RAM-F2-13', Distance: 10, EdgeType: 'elevator' },
      { upsert: true, new: true }
    );
    await Edge.findOneAndUpdate(
      { EdgeID: 'ELIFT_F0_G_1' },
      { EdgeID: 'ELIFT_F0_G_1', StartNodeID: 'RAM-F1-13', EndNodeID: 'RAM-G-12', Distance: 10, EdgeType: 'elevator' },
      { upsert: true, new: true }
    );
    await Edge.findOneAndUpdate(
      { EdgeID: 'ELIFT_F0_F1_2' },
      { EdgeID: 'ELIFT_F0_F1_2', StartNodeID: 'RAM-F1-23', EndNodeID: 'RAM-F2-19', Distance: 10, EdgeType: 'elevator' },
      { upsert: true, new: true }
    );
    await Edge.findOneAndUpdate(
      { EdgeID: 'ELIFT_F0_G_2' },
      { EdgeID: 'ELIFT_F0_G_2', StartNodeID: 'RAM-F1-23', EndNodeID: 'RAM-G-26', Distance: 10, EdgeType: 'elevator' },
      { upsert: true, new: true }
    );

    console.log('Door system completely removed. Clean direct corridor graph established!');
    process.exit(0);
  } catch (e) {
    console.error('Error removing door system:', e);
    process.exit(1);
  }
}

removeDoorSystem();
