const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/campus-navigation')
.then(async () => {
    const db = mongoose.connection.db;

    function generateID() { return 'E' + Date.now().toString().slice(-6) + Math.floor(Math.random()*1000); }

    const newEdges = [
        // Connect Turing Lab (F2-17) to Staircase 1 (F2-14)
        { EdgeID: generateID(), StartNodeID: 'RAM-F2-17', EndNodeID: 'RAM-F2-14', Distance: 50, EdgeType: 'walkway' },
        
        // Connect Staircase 1 down floors
        { EdgeID: generateID(), StartNodeID: 'RAM-F2-14', EndNodeID: 'RAM-F1-14', Distance: 80, EdgeType: 'stairs' },
        { EdgeID: generateID(), StartNodeID: 'RAM-F1-14', EndNodeID: 'RAM-G-11', Distance: 80, EdgeType: 'stairs' },

        // Connect G Staircase 1 to Gents Toilet, Cafeteria, and eventually Fire Exit (RAM-G-22)
        { EdgeID: generateID(), StartNodeID: 'RAM-G-11', EndNodeID: 'RAM-G-13', Distance: 40, EdgeType: 'walkway' },
        { EdgeID: generateID(), StartNodeID: 'RAM-G-13', EndNodeID: 'RAM-G-14', Distance: 40, EdgeType: 'walkway' },
        { EdgeID: generateID(), StartNodeID: 'RAM-G-14', EndNodeID: 'RAM-G-16', Distance: 40, EdgeType: 'walkway' },
        { EdgeID: generateID(), StartNodeID: 'RAM-G-16', EndNodeID: 'RAM-G-17', Distance: 40, EdgeType: 'walkway' },
        { EdgeID: generateID(), StartNodeID: 'RAM-G-17', EndNodeID: 'RAM-G-18', Distance: 40, EdgeType: 'walkway' },
        { EdgeID: generateID(), StartNodeID: 'RAM-G-18', EndNodeID: 'RAM-G-02', Distance: 40, EdgeType: 'walkway' },
        { EdgeID: generateID(), StartNodeID: 'RAM-G-02', EndNodeID: 'RAM-G-01', Distance: 40, EdgeType: 'walkway' },
        { EdgeID: generateID(), StartNodeID: 'RAM-G-01', EndNodeID: 'RAM-G-22', Distance: 40, EdgeType: 'walkway' } // Entrance to Fire Exit
    ];

    for (let edge of newEdges) {
        await db.collection('edges').insertOne(edge);
        console.log(`Inserted Edge: ${edge.StartNodeID} -> ${edge.EndNodeID}`);
    }

    process.exit(0);
});
