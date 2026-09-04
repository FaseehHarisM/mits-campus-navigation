const Node = require('../models/Node');

// @desc    Get all nodes
// @route   GET /api/nodes
// @access  Public
exports.getNodes = async (req, res) => {
  try {
    const nodes = await Node.find({});
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a node
// @route   POST /api/nodes
// @access  Public
exports.createNode = async (req, res) => {
  try {
    const node = new Node(req.body);
    const createdNode = await node.save();
    res.status(201).json(createdNode);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateNode = async (req, res) => {
  try {
    const node = await Node.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(node);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteNode = async (req, res) => {
  try {
    await Node.findByIdAndDelete(req.params.id);
    res.json({ message: 'Node removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
