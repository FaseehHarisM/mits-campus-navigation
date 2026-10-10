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

    const firstGNode = nodes.find(n => n.Floor === '-1');
    console.log("First G Node:", firstGNode);

    process.exit(0);
});
