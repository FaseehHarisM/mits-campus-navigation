const Edge = require('../models/Edge');

exports.getEdges = async (req, res) => {
  try {
    const edges = await Edge.find({});
    res.json(edges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createEdge = async (req, res) => {
  try {
    const edge = new Edge(req.body);
    const createdEdge = await edge.save();
    res.status(201).json(createdEdge);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateEdge = async (req, res) => {
  try {
    const edge = await Edge.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(edge);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteEdge = async (req, res) => {
  try {
    await Edge.findByIdAndDelete(req.params.id);
    res.json({ message: 'Edge removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
