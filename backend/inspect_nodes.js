const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/campus-navigation').then(async () => {
  const Node = require('./models/Node');
  const Edge = require('./models/Edge');
  const nodes = await Node.find({});
  const edges = await Edge.find({});
  console.log('Nodes count:', nodes.length, 'Edges count:', edges.length);
  const byFloor = {};
  nodes.forEach(n => {
    byFloor[n.Floor] = byFloor[n.Floor] || [];
    byFloor[n.Floor].push(n);
  });
  for (const f of Object.keys(byFloor)) {
    console.log(`=== FLOOR ${f} (${byFloor[f].length} nodes) ===`);
    byFloor[f].forEach(n => console.log(`  ${n.NodeID.padEnd(12)} | ${n.Name.padEnd(35)} | ${n.Type.padEnd(10)} | X: ${n.X}, Y: ${n.Y}`));
  }
  process.exit(0);
});
