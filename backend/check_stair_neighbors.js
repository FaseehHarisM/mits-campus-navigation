const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/campus-navigation').then(async () => {
  const Node = require('./models/Node');
  const Edge = require('./models/Edge');
  const nodes = await Node.find({});
  const edges = await Edge.find({});

  const g = {};
  nodes.forEach(n => g[n.NodeID] = {});
  edges.forEach(e => {
    if (g[e.StartNodeID] && g[e.EndNodeID]) {
      g[e.StartNodeID][e.EndNodeID] = { dist: e.Distance, type: e.EdgeType };
      g[e.EndNodeID][e.StartNodeID] = { dist: e.Distance, type: e.EdgeType };
    }
  });

  console.log("RAM-F1-14 neighbors:", g['RAM-F1-14']);
  console.log("RAM-G-11 neighbors:", g['RAM-G-11']);
  console.log("RAM-G-22 neighbors:", g['RAM-G-22']);
  process.exit(0);
});
