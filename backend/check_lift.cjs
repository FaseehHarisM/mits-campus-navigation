const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/campus-navigation').then(async () => {
  const Node = mongoose.model('Node', new mongoose.Schema({ NodeID: String, Name: String, Floor: String, X: Number, Y: Number, Type: String }));
  const Edge = mongoose.model('Edge', new mongoose.Schema({ StartNodeID: String, EndNodeID: String, Distance: Number, EdgeType: String }));
  
  const liftNodes = await Node.find({ Name: /lift/i }).lean();
  console.log('--- Lift Nodes ---');
  console.log(JSON.stringify(liftNodes, null, 2));

  const liftIds = liftNodes.map(n => n.NodeID);
  const allEdges = await Edge.find().lean();
  const liftEdges = allEdges.filter(e => liftIds.includes(e.StartNodeID) || liftIds.includes(e.EndNodeID));
  console.log('--- Lift Edges ---');
  console.log(JSON.stringify(liftEdges, null, 2));

  process.exit(0);
});
