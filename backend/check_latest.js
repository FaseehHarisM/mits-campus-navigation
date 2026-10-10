const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/campus-navigation')
.then(async () => {
    const db = mongoose.connection.db;
    const edges = await db.collection('edges').find().sort({_id: -1}).limit(5).toArray();
    console.log("Latest Edges:");
    edges.forEach(e => console.log(e));
    
    const nodes = await db.collection('nodes').find({Name: 'Junction'}).sort({_id: -1}).limit(5).toArray();
    console.log("Latest Junctions:");
    nodes.forEach(n => console.log(n));

    process.exit(0);
});
