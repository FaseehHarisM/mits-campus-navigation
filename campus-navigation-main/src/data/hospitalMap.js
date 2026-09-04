const WALL_HEIGHT = 2.5;

function generateRoomWalls(cx, cz, w, d, doorSide) {
  const walls = [];
  const thickness = 0.4;
  const h = WALL_HEIGHT;

  // Top Wall
  if (doorSide === 'top') {
    walls.push({ pos: [cx - w/4 - 1, h/2, cz - d/2], size: [w/2 - 2, h, thickness] });
    walls.push({ pos: [cx + w/4 + 1, h/2, cz - d/2], size: [w/2 - 2, h, thickness] });
  } else {
    walls.push({ pos: [cx, h/2, cz - d/2], size: [w, h, thickness] });
  }

  // Bottom Wall
  if (doorSide === 'bottom') {
    walls.push({ pos: [cx - w/4 - 1, h/2, cz + d/2], size: [w/2 - 2, h, thickness] });
    walls.push({ pos: [cx + w/4 + 1, h/2, cz + d/2], size: [w/2 - 2, h, thickness] });
  } else {
    walls.push({ pos: [cx, h/2, cz + d/2], size: [w, h, thickness] });
  }

  // Left Wall
  if (doorSide === 'left') {
    walls.push({ pos: [cx - w/2, h/2, cz - d/4 - 1], size: [thickness, h, d/2 - 2] });
    walls.push({ pos: [cx + w/2, h/2, cz + d/4 + 1], size: [thickness, h, d/2 - 2] }); // Bug fix: cx - w/2
  } else {
    walls.push({ pos: [cx - w/2, h/2, cz], size: [thickness, h, d] });
  }
  
  // Left wall Bug fix applied:
  if (doorSide === 'left') {
    walls[walls.length-1].pos = [cx - w/2, h/2, cz + d/4 + 1];
    walls[walls.length-2].pos = [cx - w/2, h/2, cz - d/4 - 1];
  }

  // Right Wall
  if (doorSide === 'right') {
    walls.push({ pos: [cx + w/2, h/2, cz - d/4 - 1], size: [thickness, h, d/2 - 2] });
    walls.push({ pos: [cx + w/2, h/2, cz + d/4 + 1], size: [thickness, h, d/2 - 2] });
  } else {
    walls.push({ pos: [cx + w/2, h/2, cz], size: [thickness, h, d] });
  }

  return walls;
}

// Generate the standard H-shape architecture walls
const hShapeWalls = [
  ...generateRoomWalls(-20.5, -8.5, 9, 14, 'right'),  // TL_West
  ...generateRoomWalls(-9.5, -8.5, 9, 14, 'left'),    // TR_West
  ...generateRoomWalls(-20.5, 8.5, 9, 14, 'right'),   // BL_West
  ...generateRoomWalls(-9.5, 8.5, 9, 14, 'left'),     // BR_West
  
  ...generateRoomWalls(9.5, -8.5, 9, 14, 'right'),    // TL_East
  ...generateRoomWalls(20.5, -8.5, 9, 14, 'left'),    // TR_East
  ...generateRoomWalls(9.5, 8.5, 9, 14, 'right'),     // BL_East
  ...generateRoomWalls(20.5, 8.5, 9, 14, 'left'),     // BR_East

  ...generateRoomWalls(0, -5, 10, 7, 'bottom'),       // Top_Hub
  ...generateRoomWalls(0, 5, 10, 7, 'top'),           // Bottom_Hub
];

// Helper to create room objects quickly
function createRoom(name, cx, cz, w, d, color, props = []) {
  return { name, pos: [cx, 0.05, cz], size: [w, d], color, props };
}

export const campusLayout = {
  floors: [
    {
      id: 0,
      level: "G",
      name: "Ground Floor",
      description: "Admin, Library & Public Facilities",
      walls: hShapeWalls,
      rooms: [
        createRoom('Admin Block', -20.5, -8.5, 9, 14, '#e74c3c', ['desks', 'cabinets']),
        createRoom("Principal's Office", -9.5, -8.5, 9, 14, '#e67e22', ['desks', 'chairs']),
        createRoom('Central Library', -20.5, 8.5, 9, 14, '#2ecc71', ['bookshelves', 'tables']),
        createRoom('Reading Room', -9.5, 8.5, 9, 14, '#3498db', ['tables', 'chairs']),
        
        createRoom('Cafeteria', 9.5, -8.5, 9, 14, '#f1c40f', ['tables', 'chairs']),
        createRoom('Placement Cell', 20.5, -8.5, 9, 14, '#9b59b6', ['desks', 'chairs']),
        createRoom('Seminar Hall', 9.5, 8.5, 9, 14, '#3498db', ['projector', 'chairs']),
        createRoom('Accounts Office', 20.5, 8.5, 9, 14, '#8e44ad', ['desks', 'cabinets']),

        createRoom('Reception & Helpdesk', 0, -5, 10, 7, '#ecf0f1', ['reception', 'plants']),
        createRoom('Main Entrance & Lifts', 0, 5, 10, 7, '#95a5a6', ['lifts']),
      ],
      route: [[0, 0.2, 5], [0, 0.2, 0], [-15, 0.2, 0], [-15, 0.2, -8.5], [-20.5, 0.2, -8.5]] // Entrance to Admin Block
    },
    {
      id: 1,
      level: "F1",
      name: "First Floor",
      description: "Department of Computer Applications (MCA)",
      walls: hShapeWalls,
      rooms: [
        createRoom('MCA - III Sem Classroom', -20.5, -8.5, 9, 14, '#a29bfe', ['desks', 'projector']),
        createRoom('MCA - I Sem Classroom', -9.5, -8.5, 9, 14, '#a29bfe', ['desks', 'projector']),
        createRoom('MCA Faculty Room 1', -20.5, 8.5, 9, 14, '#74b9ff', ['desks', 'chairs']),
        createRoom('MCA Faculty Room 2', -9.5, 8.5, 9, 14, '#55efc4', ['desks', 'chairs']),
        
        createRoom('Computer Lab 1 (Programming)', 9.5, -8.5, 9, 14, '#fd79a8', ['computers', 'servers']),
        createRoom('Computer Lab 2 (Database)', 20.5, -8.5, 9, 14, '#fab1a0', ['computers', 'servers']),
        createRoom('Project Lab', 9.5, 8.5, 9, 14, '#ffeaa7', ['computers', 'desks']),
        createRoom('Dept Library', 20.5, 8.5, 9, 14, '#55efc4', ['bookshelves', 'tables']),

        createRoom('HOD Cabin (MCA)', 0, -5, 10, 7, '#00b894', ['desks', 'cabinets']),
        createRoom('Lifts / Staircase', 0, 5, 10, 7, '#95a5a6', ['lifts']),
      ],
      route: [[0, 0.2, 5], [0, 0.2, 0], [-15, 0.2, 0], [-15, 0.2, -8.5], [-20.5, 0.2, -8.5]] // Lifts to MCA III Sem
    },
    {
      id: 2,
      level: "F2",
      name: "Second Floor",
      description: "Engineering Departments & Auditorium",
      walls: hShapeWalls,
      rooms: [
        createRoom('CS Faculty Room', -20.5, -8.5, 9, 14, '#ff7675', ['desks', 'chairs']),
        createRoom('AI & DS Classroom', -9.5, -8.5, 9, 14, '#ff7675', ['desks', 'projector']),
        createRoom('Hardware Lab', -20.5, 8.5, 9, 14, '#81ecec', ['machines', 'tools']),
        createRoom('Cyber Security Lab', -9.5, 8.5, 9, 14, '#74b9ff', ['computers', 'servers']),
        
        createRoom('Engineering Drawing Hall', 9.5, -8.5, 9, 14, '#fdcb6e', ['drafting_tables']),
        createRoom('Electronics Lab', 20.5, -8.5, 9, 14, '#fdcb6e', ['machines', 'workbenches']),
        createRoom('Meeting Room', 9.5, 8.5, 9, 14, '#e17055', ['tables', 'chairs']),
        createRoom('Student Activity Center', 20.5, 8.5, 9, 14, '#b2bec3', ['chairs', 'tables']),

        createRoom('Main Auditorium', 0, -5, 10, 7, '#ecf0f1', ['chairs', 'stage', 'projector']),
        createRoom('Lifts / Staircase', 0, 5, 10, 7, '#95a5a6', ['lifts']),
      ],
      route: [[0, 0.2, 5], [0, 0.2, 0], [0, 0.2, -5]] // Lifts to Main Auditorium
    }
  ]
};