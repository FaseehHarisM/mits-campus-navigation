const QRCode = require('../models/QRCode');
const Node = require('../models/Node');

// @desc    Get NodeID by QRID
// @route   GET /api/qr/:id
// @access  Public
exports.getQRNode = async (req, res) => {
  try {
    const rawData = req.params.id.trim();

    // 1. Try to find an exact QR mapping (e.g., QR001 -> N3)
    let qr = await QRCode.findOne({ QRID: rawData });
    let targetNodeID = qr ? qr.NodeID : null;

    // 2. If no QR mapping, maybe they scanned a NodeID directly (e.g., N3)
    if (!targetNodeID) {
      const directNode = await Node.findOne({ NodeID: rawData });
      if (directNode) targetNodeID = directNode.NodeID;
    }

    // 3. If still nothing, maybe they scanned a plain text Node Name (e.g., "Reception")
    if (!targetNodeID) {
      const nameNode = await Node.findOne({ Name: { $regex: new RegExp(`^${rawData}$`, 'i') } });
      if (nameNode) targetNodeID = nameNode.NodeID;
    }

    if (!targetNodeID) {
      return res.status(404).json({ message: 'Unrecognized Campus QR Code' });
    }
    
    const node = await Node.findOne({ NodeID: targetNodeID });
    if (!node) return res.status(404).json({ message: 'Node mapping broken in database' });

    res.json(node);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getQRCodes = async (req, res) => {
  try {
    const qrs = await QRCode.find({});
    res.json(qrs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createQRCode = async (req, res) => {
  try {
    const qr = new QRCode(req.body);
    const createdQR = await qr.save();
    res.status(201).json(createdQR);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateQRCode = async (req, res) => {
  try {
    const qr = await QRCode.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(qr);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteQRCode = async (req, res) => {
  try {
    await QRCode.findByIdAndDelete(req.params.id);
    res.json({ message: 'QR Code removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
