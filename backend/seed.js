const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Node = require('./models/Node');
const Edge = require('./models/Edge');
const Faculty = require('./models/Faculty');
const Event = require('./models/Event');
const QRCode = require('./models/QRCode');

dotenv.config();
connectDB();

function getDist(x1, y1, x2, y2) {
  return Math.round(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
}

// Floor Mapping: G = -1, 0 = 0, 1 = 1
const nodes = [
  // FLOOR 0 (Ground)
  { NodeID: 'N0_1', Name: 'MCA 2nd Year Class', Type: 'Classroom', Floor: '0', X: 200, Y: 200 },
  { NodeID: 'N0_2', Name: 'Library', Type: 'Library', Floor: '0', X: 600, Y: 200 },
  { NodeID: 'N0_3', Name: 'Albert Einstein Hall', Type: 'Hall', Floor: '0', X: 1000, Y: 200 },
  { NodeID: 'N0_4', Name: 'Event Hall', Type: 'Hall', Floor: '0', X: 1400, Y: 200 },
  { NodeID: 'N0_5', Name: 'Gents & Ladies Toilet (F0)', Type: 'Washroom', Floor: '0', X: 1800, Y: 200 },
  
  { NodeID: 'N0_6', Name: 'MCA Department', Type: 'Office', Floor: '0', X: 200, Y: 900 },
  { NodeID: 'N0_7', Name: 'MCA 1st Year Class', Type: 'Classroom', Floor: '0', X: 600, Y: 900 },
  { NodeID: 'N0_8', Name: 'Reception', Type: 'Office', Floor: '0', X: 1000, Y: 900 },
  { NodeID: 'N0_9', Name: 'MCA Lab', Type: 'Lab', Floor: '0', X: 1400, Y: 900 },
  { NodeID: 'N0_10', Name: 'Tutorial Room', Type: 'Classroom', Floor: '0', X: 1800, Y: 900 },

  // Floor 0 Junctions (Doors)
  { NodeID: 'J0_1', Name: 'Reception Door', Type: 'Junction', Floor: '0', X: 200, Y: 450 },
  { NodeID: 'J0_2', Name: 'Library Door', Type: 'Junction', Floor: '0', X: 600, Y: 450 },
  { NodeID: 'J0_3', Name: 'Einstein Hall Door', Type: 'Junction', Floor: '0', X: 1000, Y: 450 },
  { NodeID: 'J0_4', Name: 'Event Hall Door', Type: 'Junction', Floor: '0', X: 1400, Y: 450 },
  { NodeID: 'J0_5', Name: 'Toilet Door F0', Type: 'Junction', Floor: '0', X: 1800, Y: 450 },
  { NodeID: 'J0_6', Name: 'MCA Dept Door', Type: 'Junction', Floor: '0', X: 200, Y: 650 },
  { NodeID: 'J0_7', Name: 'MCA 1st Door', Type: 'Junction', Floor: '0', X: 600, Y: 650 },
  { NodeID: 'J0_8', Name: 'MCA 2nd Door', Type: 'Junction', Floor: '0', X: 1000, Y: 650 },
  { NodeID: 'J0_9', Name: 'MCA Lab Door', Type: 'Junction', Floor: '0', X: 1400, Y: 650 },
  { NodeID: 'J0_10', Name: 'Tutorial Door', Type: 'Junction', Floor: '0', X: 1800, Y: 650 },

  // Floor 0 Corridor
  { NodeID: 'C0_1', Name: 'F0 Corridor L1', Type: 'Junction', Floor: '0', X: 200, Y: 550 },
  { NodeID: 'C0_2', Name: 'F0 Corridor L2', Type: 'Junction', Floor: '0', X: 600, Y: 550 },
  { NodeID: 'C0_3', Name: 'F0 Corridor M', Type: 'Junction', Floor: '0', X: 1000, Y: 550 },
  { NodeID: 'C0_4', Name: 'F0 Corridor R1', Type: 'Junction', Floor: '0', X: 1400, Y: 550 },
  { NodeID: 'C0_5', Name: 'F0 Corridor R2', Type: 'Junction', Floor: '0', X: 1800, Y: 550 },

  // Lift and Stairs F0 (Located ON the corridor)
  { NodeID: 'LIFT_0', Name: 'Main Lift (F0)', Type: 'Elevator', Floor: '0', X: 1400, Y: 550 },
  { NodeID: 'STAIR_0', Name: 'Main Stairs (F0)', Type: 'Stairs', Floor: '0', X: 600, Y: 550 },
  { NodeID: 'FIRE_0', Name: 'Fire Exit F0', Type: 'Exit', Floor: '0', X: 200, Y: 550 },

  // FLOOR 1
  { NodeID: 'N1_1', Name: 'Principal', Type: 'Office', Floor: '1', X: 200, Y: 200 },
  { NodeID: 'N1_2', Name: 'Vice Principal', Type: 'Office', Floor: '1', X: 600, Y: 200 },
  { NodeID: 'N1_3', Name: 'Office', Type: 'Office', Floor: '1', X: 1000, Y: 200 },
  { NodeID: 'N1_4', Name: 'Controller of Examination', Type: 'Office', Floor: '1', X: 1400, Y: 200 },
  { NodeID: 'N1_5', Name: 'Gents & Ladies Toilet (F1)', Type: 'Washroom', Floor: '1', X: 1800, Y: 200 },
  { NodeID: 'N1_6', Name: 'CIDRIE', Type: 'Lab', Floor: '1', X: 200, Y: 900 },

  // Floor 1 Junctions
  { NodeID: 'J1_1', Name: 'Principal Door', Type: 'Junction', Floor: '1', X: 200, Y: 450 },
  { NodeID: 'J1_2', Name: 'Vice Principal Door', Type: 'Junction', Floor: '1', X: 600, Y: 450 },
  { NodeID: 'J1_3', Name: 'Office Door', Type: 'Junction', Floor: '1', X: 1000, Y: 450 },
  { NodeID: 'J1_4', Name: 'COE Door', Type: 'Junction', Floor: '1', X: 1400, Y: 450 },
  { NodeID: 'J1_5', Name: 'Toilet Door F1', Type: 'Junction', Floor: '1', X: 1800, Y: 450 },
  { NodeID: 'J1_6', Name: 'CIDRIE Door', Type: 'Junction', Floor: '1', X: 200, Y: 650 },

  // Floor 1 Corridor
  { NodeID: 'C1_1', Name: 'F1 Corridor L1', Type: 'Junction', Floor: '1', X: 200, Y: 550 },
  { NodeID: 'C1_2', Name: 'F1 Corridor L2', Type: 'Junction', Floor: '1', X: 600, Y: 550 },
  { NodeID: 'C1_3', Name: 'F1 Corridor M', Type: 'Junction', Floor: '1', X: 1000, Y: 550 },
  { NodeID: 'C1_4', Name: 'F1 Corridor R1', Type: 'Junction', Floor: '1', X: 1400, Y: 550 },
  { NodeID: 'C1_5', Name: 'F1 Corridor R2', Type: 'Junction', Floor: '1', X: 1800, Y: 550 },

  // Lift and Stairs F1
  { NodeID: 'LIFT_1', Name: 'Main Lift (F1)', Type: 'Elevator', Floor: '1', X: 1400, Y: 550 },
  { NodeID: 'STAIR_1', Name: 'Main Stairs (F1)', Type: 'Stairs', Floor: '1', X: 600, Y: 550 },
  { NodeID: 'FIRE_1', Name: 'Fire Exit F1', Type: 'Exit', Floor: '1', X: 200, Y: 550 },

  // FLOOR -1 (G)
  { NodeID: 'NG_1', Name: 'Cafe', Type: 'Cafeteria', Floor: '-1', X: 600, Y: 200 },
  { NodeID: 'NG_2', Name: 'Gym', Type: 'Gym', Floor: '-1', X: 1000, Y: 200 },
  { NodeID: 'JG_1', Name: 'Cafe Door', Type: 'Junction', Floor: '-1', X: 600, Y: 450 },
  { NodeID: 'JG_2', Name: 'Gym Door', Type: 'Junction', Floor: '-1', X: 1000, Y: 450 },
  { NodeID: 'CG_1', Name: 'FG Corridor L2', Type: 'Junction', Floor: '-1', X: 600, Y: 550 },
  { NodeID: 'CG_2', Name: 'FG Corridor M', Type: 'Junction', Floor: '-1', X: 1000, Y: 550 },
  { NodeID: 'CG_3', Name: 'FG Corridor R1', Type: 'Junction', Floor: '-1', X: 1400, Y: 550 },
  
  { NodeID: 'LIFT_G', Name: 'Main Lift (G)', Type: 'Elevator', Floor: '-1', X: 1400, Y: 550 },
  { NodeID: 'STAIR_G', Name: 'Main Stairs (G)', Type: 'Stairs', Floor: '-1', X: 600, Y: 550 },
];

const edges = [
  // INTRA-FLOOR 0 EDGES
  { EdgeID: 'E0_1', StartNodeID: 'N0_1', EndNodeID: 'J0_1', Distance: 250, EdgeType: 'walkway' },
  { EdgeID: 'E0_2', StartNodeID: 'N0_2', EndNodeID: 'J0_2', Distance: 250, EdgeType: 'walkway' },
  { EdgeID: 'E0_3', StartNodeID: 'N0_3', EndNodeID: 'J0_3', Distance: 250, EdgeType: 'walkway' },
  { EdgeID: 'E0_4', StartNodeID: 'N0_4', EndNodeID: 'J0_4', Distance: 250, EdgeType: 'walkway' },
  { EdgeID: 'E0_5', StartNodeID: 'N0_5', EndNodeID: 'J0_5', Distance: 250, EdgeType: 'walkway' },
  { EdgeID: 'E0_6', StartNodeID: 'N0_6', EndNodeID: 'J0_6', Distance: 250, EdgeType: 'walkway' },
  { EdgeID: 'E0_7', StartNodeID: 'N0_7', EndNodeID: 'J0_7', Distance: 250, EdgeType: 'walkway' },
  { EdgeID: 'E0_8', StartNodeID: 'N0_8', EndNodeID: 'J0_8', Distance: 250, EdgeType: 'walkway' },
  { EdgeID: 'E0_9', StartNodeID: 'N0_9', EndNodeID: 'J0_9', Distance: 250, EdgeType: 'walkway' },
  { EdgeID: 'E0_10', StartNodeID: 'N0_10', EndNodeID: 'J0_10', Distance: 250, EdgeType: 'walkway' },

  { EdgeID: 'E0_C1', StartNodeID: 'J0_1', EndNodeID: 'C0_1', Distance: 100, EdgeType: 'walkway' },
  { EdgeID: 'E0_C2', StartNodeID: 'J0_2', EndNodeID: 'C0_2', Distance: 100, EdgeType: 'walkway' },
  { EdgeID: 'E0_C3', StartNodeID: 'J0_3', EndNodeID: 'C0_3', Distance: 100, EdgeType: 'walkway' },
  { EdgeID: 'E0_C4', StartNodeID: 'J0_4', EndNodeID: 'C0_4', Distance: 100, EdgeType: 'walkway' },
  { EdgeID: 'E0_C5', StartNodeID: 'J0_5', EndNodeID: 'C0_5', Distance: 100, EdgeType: 'walkway' },
  { EdgeID: 'E0_C6', StartNodeID: 'J0_6', EndNodeID: 'C0_1', Distance: 100, EdgeType: 'walkway' },
  { EdgeID: 'E0_C7', StartNodeID: 'J0_7', EndNodeID: 'C0_2', Distance: 100, EdgeType: 'walkway' },
  { EdgeID: 'E0_C8', StartNodeID: 'J0_8', EndNodeID: 'C0_3', Distance: 100, EdgeType: 'walkway' },
  { EdgeID: 'E0_C9', StartNodeID: 'J0_9', EndNodeID: 'C0_4', Distance: 100, EdgeType: 'walkway' },
  { EdgeID: 'E0_C10', StartNodeID: 'J0_10', EndNodeID: 'C0_5', Distance: 100, EdgeType: 'walkway' },

  { EdgeID: 'E0_Cor1', StartNodeID: 'C0_1', EndNodeID: 'C0_2', Distance: 400, EdgeType: 'walkway' },
  { EdgeID: 'E0_Cor2', StartNodeID: 'C0_2', EndNodeID: 'C0_3', Distance: 400, EdgeType: 'walkway' },
  { EdgeID: 'E0_Cor3', StartNodeID: 'C0_3', EndNodeID: 'C0_4', Distance: 400, EdgeType: 'walkway' },
  { EdgeID: 'E0_Cor4', StartNodeID: 'C0_4', EndNodeID: 'C0_5', Distance: 400, EdgeType: 'walkway' },
  
  // Connect LIFT and STAIRS to their nearest corridor node (they are ON the node, distance=1)
  { EdgeID: 'E0_LIFT', StartNodeID: 'C0_4', EndNodeID: 'LIFT_0', Distance: 1, EdgeType: 'walkway' },
  { EdgeID: 'E0_STAIR', StartNodeID: 'C0_2', EndNodeID: 'STAIR_0', Distance: 1, EdgeType: 'walkway' },

  // INTRA-FLOOR 1 EDGES
  { EdgeID: 'E1_1', StartNodeID: 'N1_1', EndNodeID: 'J1_1', Distance: 250, EdgeType: 'walkway' },
  { EdgeID: 'E1_2', StartNodeID: 'N1_2', EndNodeID: 'J1_2', Distance: 250, EdgeType: 'walkway' },
  { EdgeID: 'E1_3', StartNodeID: 'N1_3', EndNodeID: 'J1_3', Distance: 250, EdgeType: 'walkway' },
  { EdgeID: 'E1_4', StartNodeID: 'N1_4', EndNodeID: 'J1_4', Distance: 250, EdgeType: 'walkway' },
  { EdgeID: 'E1_5', StartNodeID: 'N1_5', EndNodeID: 'J1_5', Distance: 250, EdgeType: 'walkway' },
  { EdgeID: 'E1_6', StartNodeID: 'N1_6', EndNodeID: 'J1_6', Distance: 250, EdgeType: 'walkway' },

  { EdgeID: 'E1_C1', StartNodeID: 'J1_1', EndNodeID: 'C1_1', Distance: 100, EdgeType: 'walkway' },
  { EdgeID: 'E1_C2', StartNodeID: 'J1_2', EndNodeID: 'C1_2', Distance: 100, EdgeType: 'walkway' },
  { EdgeID: 'E1_C3', StartNodeID: 'J1_3', EndNodeID: 'C1_3', Distance: 100, EdgeType: 'walkway' },
  { EdgeID: 'E1_C4', StartNodeID: 'J1_4', EndNodeID: 'C1_4', Distance: 100, EdgeType: 'walkway' },
  { EdgeID: 'E1_C5', StartNodeID: 'J1_5', EndNodeID: 'C1_5', Distance: 100, EdgeType: 'walkway' },
  { EdgeID: 'E1_C6', StartNodeID: 'J1_6', EndNodeID: 'C1_1', Distance: 100, EdgeType: 'walkway' },

  { EdgeID: 'E1_Cor1', StartNodeID: 'C1_1', EndNodeID: 'C1_2', Distance: 400, EdgeType: 'walkway' },
  { EdgeID: 'E1_Cor2', StartNodeID: 'C1_2', EndNodeID: 'C1_3', Distance: 400, EdgeType: 'walkway' },
  { EdgeID: 'E1_Cor3', StartNodeID: 'C1_3', EndNodeID: 'C1_4', Distance: 400, EdgeType: 'walkway' },
  { EdgeID: 'E1_Cor4', StartNodeID: 'C1_4', EndNodeID: 'C1_5', Distance: 400, EdgeType: 'walkway' },
  { EdgeID: 'E1_LIFT', StartNodeID: 'C1_4', EndNodeID: 'LIFT_1', Distance: 1, EdgeType: 'walkway' },
  { EdgeID: 'E1_STAIR', StartNodeID: 'C1_2', EndNodeID: 'STAIR_1', Distance: 1, EdgeType: 'walkway' },

  // INTRA-FLOOR -1 (G) EDGES
  { EdgeID: 'EG_1', StartNodeID: 'NG_1', EndNodeID: 'JG_1', Distance: 250, EdgeType: 'walkway' },
  { EdgeID: 'EG_2', StartNodeID: 'NG_2', EndNodeID: 'JG_2', Distance: 250, EdgeType: 'walkway' },
  { EdgeID: 'EG_C1', StartNodeID: 'JG_1', EndNodeID: 'CG_1', Distance: 100, EdgeType: 'walkway' },
  { EdgeID: 'EG_C2', StartNodeID: 'JG_2', EndNodeID: 'CG_2', Distance: 100, EdgeType: 'walkway' },
  { EdgeID: 'EG_Cor1', StartNodeID: 'CG_1', EndNodeID: 'CG_2', Distance: 400, EdgeType: 'walkway' },
  { EdgeID: 'EG_Cor2', StartNodeID: 'CG_2', EndNodeID: 'CG_3', Distance: 400, EdgeType: 'walkway' },
  { EdgeID: 'EG_LIFT', StartNodeID: 'CG_3', EndNodeID: 'LIFT_G', Distance: 1, EdgeType: 'walkway' },
  { EdgeID: 'EG_STAIR', StartNodeID: 'CG_1', EndNodeID: 'STAIR_G', Distance: 1, EdgeType: 'walkway' },

  // INTER-FLOOR LIFT EDGES (Weight = 10 for elevator speed)
  { EdgeID: 'INTER_L1', StartNodeID: 'LIFT_G', EndNodeID: 'LIFT_0', Distance: 50, EdgeType: 'elevator' },
  { EdgeID: 'INTER_L2', StartNodeID: 'LIFT_0', EndNodeID: 'LIFT_1', Distance: 50, EdgeType: 'elevator' },
  
  // INTER-FLOOR STAIR EDGES (Weight = 300 for stairs climbing)
  { EdgeID: 'INTER_S1', StartNodeID: 'STAIR_G', EndNodeID: 'STAIR_0', Distance: 300, EdgeType: 'stairs' },
  { EdgeID: 'INTER_S2', StartNodeID: 'STAIR_0', EndNodeID: 'STAIR_1', Distance: 300, EdgeType: 'stairs' },
];

const faculties = [
  // Administration
  { Name: 'Dr. Neelakantan P. C.', Department: 'Administration', Designation: 'Principal', RoomNodeID: 'N1_1' },
  { Name: 'Dr. Chikku Abraham', Department: 'Administration', Designation: 'Vice Principal', RoomNodeID: 'N1_2' },
  
  // MCA Department
  { Name: 'Mr. Sivadas T Nair', Department: 'Master of Computer Applications', Designation: 'HOD', RoomNodeID: 'N0_6' },
  { Name: 'Dr. Saritha K', Department: 'Master of Computer Applications', Designation: 'Professor', RoomNodeID: 'N0_6' },
  { Name: 'Dr. Sujithra Sankar', Department: 'Master of Computer Applications', Designation: 'Asst. Professor', RoomNodeID: 'N0_6' },
  { Name: 'Ms. Jiss Kuruvilla', Department: 'Master of Computer Applications', Designation: 'Asst. Professor', RoomNodeID: 'N0_6' },
  { Name: 'Dr. Smitha Anu Thomas', Department: 'Master of Computer Applications', Designation: 'Asst. Professor', RoomNodeID: 'N0_6' },
  { Name: 'Dr. Geethu S.', Department: 'Master of Computer Applications', Designation: 'Asst. Professor', RoomNodeID: 'N0_6' }
];

const now = new Date();
const tomorrow = new Date();
tomorrow.setDate(now.getDate() + 1);
const nextWeek = new Date();
nextWeek.setDate(now.getDate() + 7);

const events = [
  { Title: 'MCA Inauguration', VenueNodeID: 'N0_4', StartTime: now, EndTime: tomorrow },
  { Title: 'Einstein Talk', VenueNodeID: 'N0_3', StartTime: nextWeek, EndTime: nextWeek },
  { Title: 'Tech Symposium 2026', VenueNodeID: 'N0_4', StartTime: tomorrow, EndTime: nextWeek },
  { Title: 'AI & Data Science Workshop', VenueNodeID: 'N0_9', StartTime: now, EndTime: tomorrow },
  { Title: 'Faculty General Meeting', VenueNodeID: 'N0_3', StartTime: tomorrow, EndTime: tomorrow },
  { Title: 'TCS Placement Drive', VenueNodeID: 'N0_4', StartTime: nextWeek, EndTime: nextWeek },
  { Title: 'MITS Hackathon Kickoff', VenueNodeID: 'N0_9', StartTime: now, EndTime: now },
  { Title: 'Guest Lecture: Quantum Computing', VenueNodeID: 'N0_10', StartTime: nextWeek, EndTime: nextWeek },
];

const qrs = [
  { QRID: 'QR001', NodeID: 'N0_8' },  
  { QRID: 'QR002', NodeID: 'N0_6' }, 
  { QRID: 'QR003', NodeID: 'N1_1' }, 
  { QRID: 'QR004', NodeID: 'NG_1' }, 
  { QRID: 'QR005', NodeID: 'LIFT_0' }
];

const importData = async () => {
  try {
    await Node.deleteMany();
    await Edge.deleteMany();
    await Faculty.deleteMany();
    await Event.deleteMany();
    await QRCode.deleteMany();

    await Node.insertMany(nodes);
    await Edge.insertMany(edges);
    await Faculty.insertMany(faculties);
    await Event.insertMany(events);
    await QRCode.insertMany(qrs);

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

importData();
