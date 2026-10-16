const mongoose = require('mongoose');
require('dotenv').config();

const Node = require('./models/Node');
const Edge = require('./models/Edge');

const floor0Rooms = [
  { id: 'RAM-F1-01', name: 'FIRE EXIT', type: 'Stairs', x: -7903, y: -777, doorX: -7255, doorY: -777 },
  { id: 'RAM-F1-02', name: 'LADIES TOILET', type: 'Washroom', x: -7255, y: -1997, doorX: -7255, doorY: -600 },
  { id: 'RAM-F1-03', name: 'ELECTRICAL & ELECTRONICS DEPARTMENT', type: 'Office', x: -5689, y: -1965, doorX: -5689, doorY: -600 },
  { id: 'RAM-F1-04', name: 'CLASS ROOM (4)', type: 'Classroom', x: -3322, y: -1909, doorX: -3322, doorY: -600 },
  { id: 'RAM-F1-05', name: 'CLASS ROOM (5)', type: 'Classroom', x: -1547, y: -1934, doorX: -1547, doorY: -600 },
  { id: 'RAM-F1-06', name: 'PROJECT LAB', type: 'Lab', x: -109, y: -1887, doorX: -109, doorY: -600 },
  { id: 'RAM-F1-07', name: 'POWER SYSTEM LAB', type: 'Lab', x: 1222, y: -1543, doorX: 1222, doorY: -600 },
  { id: 'RAM-F1-08', name: 'RESEARCH LAB', type: 'Lab', x: 2916, y: -1572, doorX: 2916, doorY: -600 },
  { id: 'RAM-F1-09', name: 'SIEMENS LAB', type: 'Lab', x: 4322, y: -1323, doorX: 4322, doorY: -600 },
  { id: 'RAM-F1-10', name: 'CONFERENCE ROOM', type: 'Office', x: 5721, y: -1136, doorX: 5721, doorY: -600 },
  { id: 'RAM-F1-11', name: 'CLASS ROOM (11)', type: 'Classroom', x: 7673, y: -1324, doorX: 7673, doorY: -600 },
  { id: 'RAM-F1-12', name: 'GENTS TOILET', type: 'Washroom', x: 9191, y: -1255, doorX: 9000, doorY: -600 },
  { id: 'RAM-F1-13', name: 'LIFT 1', type: 'Elevator', x: 9760, y: 812, doorX: 9000, doorY: 812 },
  { id: 'RAM-F1-14', name: 'STAIRCASE 1', type: 'Stairs', x: 9589, y: 2440, doorX: 9000, doorY: 2440 },
  { id: 'RAM-F1-15', name: 'COMMON COMPUTING FACILITY 1', type: 'Lab', x: 7611, y: 2466, doorX: 7611, doorY: 1800 },
  { id: 'RAM-F1-16', name: 'SYSTEM ADMIN ROOM', type: 'Office', x: 5955, y: 2777, doorX: 5955, doorY: 1800 },
  { id: 'RAM-F1-17', name: 'SERVER ROOM', type: 'Server', x: 5367, y: 2535, doorX: 5367, doorY: 1800 },
  { id: 'RAM-F1-18', name: 'CONSTRUCTION & MAINTENANCE CELL', type: 'Office', x: 4731, y: 3276, doorX: 4731, doorY: 1800 },
  { id: 'RAM-F1-19', name: 'INTERVIEW ROOM', type: 'Office', x: 3124, y: 2846, doorX: 3124, doorY: 1800 },
  { id: 'RAM-F1-20', name: 'PLACEMENT CELL', type: 'Office', x: 798, y: 3464, doorX: 798, doorY: 1800 },
  { id: 'RAM-F1-21', name: 'COUNSELOR ROOM', type: 'Office', x: 798, y: 2227, doorX: 1100, doorY: 1800 },
  { id: 'RAM-F1-22', name: 'WAITING ROOM', type: 'Office', x: 1429, y: 1560, doorX: 1429, doorY: 1800 },
  { id: 'RAM-F1-23', name: 'LIFT 2', type: 'Elevator', x: -1202, y: 1559, doorX: -1202, doorY: 1800 },
  { id: 'RAM-F1-24', name: 'STAIRCASE 2', type: 'Stairs', x: -2514, y: 1354, doorX: -2514, doorY: 1800 },
  { id: 'RAM-F1-25', name: 'ELECTRICAL ROOM', type: 'Office', x: -2431, y: 194, doorX: -2431, doorY: 500 },
  { id: 'RAM-F1-26', name: 'TOILET FOR HANDICAPPED', type: 'Washroom', x: -7216, y: 162, doorX: -7216, doorY: 500 }
];

function calcDist(x1, y1, x2, y2) {
  return Math.round(Math.hypot(x2 - x1, y2 - y1));
}

async function seedFloor0Doors() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-navigation');
    console.log('Connected to MongoDB');

    // 1. Create or Update Door Nodes & update Room Nodes with DoorNodeID
    for (const r of floor0Rooms) {
      const doorId = `${r.id}-DOOR`;
      const doorName = `${r.name} Door`;

      // Upsert Door Node
      await Node.findOneAndUpdate(
        { NodeID: doorId },
        {
          NodeID: doorId,
          Name: doorName,
          Type: 'Door',
          Floor: '0',
          FloorID: 'First Floor',
          X: r.doorX,
          Y: r.doorY,
          RoomNodeID: r.id
        },
        { upsert: true, new: true }
      );

      // Link Room Node to Door Node
      await Node.findOneAndUpdate(
        { NodeID: r.id },
        {
          $set: {
            DoorNodeID: doorId,
            X: r.x,
            Y: r.y
          }
        }
      );

      // Create Door Connection Edge (Room Node <-> Door Node)
      const doorEdgeId = `EDOOR_${r.id}`;
      const dist = calcDist(r.x, r.y, r.doorX, r.doorY);
      await Edge.findOneAndUpdate(
        { EdgeID: doorEdgeId },
        {
          EdgeID: doorEdgeId,
          StartNodeID: r.id,
          EndNodeID: doorId,
          Distance: dist,
          EdgeType: 'door_connection'
        },
        { upsert: true, new: true }
      );
    }
    console.log(`Created ${floor0Rooms.length} Door Nodes and Door Connection Edges!`);

    // 2. Create Corridor Junction Nodes & Walkway Edges along corridors
    // North corridor doors (sorted west to east):
    // RAM-F1-02-DOOR (-7255, -600), RAM-F1-03-DOOR (-5689, -600), RAM-F1-04-DOOR (-3322, -600),
    // RAM-F1-05-DOOR (-1547, -600), RAM-F1-06-DOOR (-109, -600), RAM-F1-07-DOOR (1222, -600),
    // RAM-F1-08-DOOR (2916, -600), RAM-F1-09-DOOR (4322, -600), RAM-F1-10-DOOR (5721, -600),
    // RAM-F1-11-DOOR (7673, -600), RAM-F1-12-DOOR (9000, -600)
    const northCorridor = [
      'RAM-F1-02-DOOR',
      'RAM-F1-03-DOOR',
      'RAM-F1-04-DOOR',
      'RAM-F1-05-DOOR',
      'RAM-F1-06-DOOR',
      'RAM-F1-07-DOOR',
      'RAM-F1-08-DOOR',
      'RAM-F1-09-DOOR',
      'RAM-F1-10-DOOR',
      'RAM-F1-11-DOOR',
      'RAM-F1-12-DOOR'
    ];

    // East corridor doors (sorted north to south):
    // RAM-F1-12-DOOR (9000, -600), RAM-F1-13-DOOR (9000, 812), RAM-F1-14-DOOR (9000, 2440), Corner (9000, 1800)
    // Add east corner junction if needed, or link 12-DOOR -> 13-DOOR -> (corner) -> 14-DOOR
    const eastCorridor = [
      'RAM-F1-12-DOOR',
      'RAM-F1-13-DOOR',
      'RAM-F1-15-DOOR', // (7611, 1800) connects to (9000, 1800)
      'RAM-F1-14-DOOR'
    ];

    // South corridor doors (sorted east to west):
    // RAM-F1-15-DOOR (7611, 1800), RAM-F1-16-DOOR (5955, 1800), RAM-F1-17-DOOR (5367, 1800),
    // RAM-F1-18-DOOR (4731, 1800), RAM-F1-19-DOOR (3124, 1800), RAM-F1-22-DOOR (1429, 1800),
    // RAM-F1-21-DOOR (1100, 1800), RAM-F1-20-DOOR (798, 1800), RAM-F1-23-DOOR (-1202, 1800),
    // RAM-F1-24-DOOR (-2514, 1800), RAM-F1-SW-CORNER (-7255, 1800)
    const southCorridor = [
      'RAM-F1-15-DOOR',
      'RAM-F1-16-DOOR',
      'RAM-F1-17-DOOR',
      'RAM-F1-18-DOOR',
      'RAM-F1-19-DOOR',
      'RAM-F1-22-DOOR',
      'RAM-F1-21-DOOR',
      'RAM-F1-20-DOOR',
      'RAM-F1-23-DOOR',
      'RAM-F1-24-DOOR'
    ];

    // West corridor doors (sorted south to north):
    // (-2514, 1800) -> (-2431, 500) RAM-F1-25-DOOR -> (-7216, 500) RAM-F1-26-DOOR ->
    // (-7255, -777) RAM-F1-01-DOOR -> (-7255, -600) RAM-F1-02-DOOR
    const westCorridor = [
      'RAM-F1-24-DOOR',
      'RAM-F1-25-DOOR',
      'RAM-F1-26-DOOR',
      'RAM-F1-01-DOOR',
      'RAM-F1-02-DOOR'
    ];

    // Helper to add walkway edge
    const nodesMap = new Map();
    const allDbNodes = await Node.find({});
    allDbNodes.forEach(n => nodesMap.set(n.NodeID, n));

    async function addWalkway(nodeA, nodeB, edgePrefix = 'E_F0') {
      const na = nodesMap.get(nodeA);
      const nb = nodesMap.get(nodeB);
      if (!na || !nb) {
        console.warn(`Missing node for walkway: ${nodeA} or ${nodeB}`);
        return;
      }
      const dist = calcDist(na.X, na.Y, nb.X, nb.Y);
      const edgeId = `${edgePrefix}_${nodeA}_${nodeB}`;
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

    // Connect North Corridor sequential nodes
    for (let i = 0; i < northCorridor.length - 1; i++) {
      await addWalkway(northCorridor[i], northCorridor[i + 1]);
    }

    // Connect East Corridor sequential nodes
    // RAM-F1-12-DOOR -> RAM-F1-13-DOOR
    await addWalkway('RAM-F1-12-DOOR', 'RAM-F1-13-DOOR');
    // RAM-F1-13-DOOR -> RAM-F1-15-DOOR
    await addWalkway('RAM-F1-13-DOOR', 'RAM-F1-15-DOOR');
    // RAM-F1-15-DOOR -> RAM-F1-14-DOOR (Stairs 1)
    await addWalkway('RAM-F1-15-DOOR', 'RAM-F1-14-DOOR');

    // Connect South Corridor sequential nodes
    for (let i = 0; i < southCorridor.length - 1; i++) {
      await addWalkway(southCorridor[i], southCorridor[i + 1]);
    }

    // Connect West Corridor sequential nodes
    for (let i = 0; i < westCorridor.length - 1; i++) {
      await addWalkway(westCorridor[i], westCorridor[i + 1]);
    }

    // 3. Multi-floor Connections: Connect Floor 0 Stairs and Lifts to Floor 1 and Floor -1!
    // Staircase 1: RAM-F1-14 (F0) <-> RAM-F2-14 (F1/F2) & RAM-G-11 (G)
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

    // Staircase 2: RAM-F1-24 (F0) <-> RAM-F2-20 (F1) & RAM-G-25 (G)
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

    // Lift 1: RAM-F1-13 (F0) <-> RAM-F2-13 (F1) & RAM-G-12 (G)
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

    // Lift 2: RAM-F1-23 (F0) <-> RAM-F2-19 (F1) & RAM-G-26 (G)
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

    console.log('Successfully seeded all Floor 0 Door Nodes, Corridor Walkways, and Inter-floor connections!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding floor 0 doors:', err);
    process.exit(1);
  }
}

seedFloor0Doors();
