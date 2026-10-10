const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/campus-navigation')
.then(async () => {
    const db = mongoose.connection.db;
    const nodes = await db.collection('nodes').find().toArray();
    
    const floors = {};
    nodes.forEach(n => {
        floors[n.Floor] = (floors[n.Floor] || 0) + 1;
    });
    console.log("Nodes per floor:", floors);

    const f2Nodes = nodes.filter(n => n.Floor === '1');
    console.log("Total F2 Nodes (Floor='1'):", f2Nodes.length);
    console.log("F2 Non-Junction Nodes:", f2Nodes.filter(n => n.Type !== 'Junction').length);

    process.exit(0);
});
