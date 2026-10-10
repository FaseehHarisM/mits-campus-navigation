const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/campus-navigation')
.then(async () => {
    console.log("Connected to MongoDB.");
    
    const db = mongoose.connection.db;
    const nodes = await db.collection('nodes').find({}).toArray();
    const edges = await db.collection('edges').find({}).toArray();
    
    console.log(`Total Nodes: ${nodes.length}`);
    console.log(`Total Edges: ${edges.length}`);
    
    const csDept = nodes.find(n => n.Name === 'COMPUTER SCIENCE DEPT');
    if (!csDept) {
        console.log("CS Dept not found.");
    } else {
        console.log(`CS Dept NodeID: ${csDept.NodeID}`);
        const connectedEdges = edges.filter(e => e.StartNodeID === csDept.NodeID || e.EndNodeID === csDept.NodeID);
        console.log(`Edges connected to CS Dept: ${connectedEdges.length}`);
        connectedEdges.forEach(e => {
            console.log(`  Edge ${e.EdgeID} connects ${e.StartNodeID} and ${e.EndNodeID}`);
        });
    }

    const exits = nodes.filter(n => n.Type === 'Exit' || (n.Name && (n.Name.toLowerCase().includes('exit') || n.Name.toLowerCase().includes('main door'))));
    console.log(`Exits configured: ${exits.length}`);
    exits.forEach(ex => {
        console.log(`  Exit NodeID: ${ex.NodeID}, Name: ${ex.Name}`);
    });
    
    process.exit(0);
})
.catch(err => {
    console.error(err);
    process.exit(1);
});
