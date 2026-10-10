const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/campus-navigation')
.then(async () => {
    const db = mongoose.connection.db;
    const nodes = await db.collection('nodes').find({}).toArray();
    const edges = await db.collection('edges').find({}).toArray();
    
    // Dump F2 Nodes
    console.log("--- F2 Nodes (Floor: '1') ---");
    nodes.filter(n => n.Floor === '1').forEach(n => console.log(`${n.NodeID}: ${n.Name || 'Junction'} (X:${n.X}, Y:${n.Y})`));

    // Dump F1 Nodes
    console.log("\n--- F1 Nodes (Floor: '0') ---");
    nodes.filter(n => n.Floor === '0').forEach(n => console.log(`${n.NodeID}: ${n.Name || 'Junction'} (X:${n.X}, Y:${n.Y})`));

    // Dump Ground Nodes
    console.log("\n--- G Nodes (Floor: '-1') ---");
    nodes.filter(n => n.Floor === '-1').forEach(n => console.log(`${n.NodeID}: ${n.Name || 'Junction'} (X:${n.X}, Y:${n.Y})`));

    process.exit(0);
});
