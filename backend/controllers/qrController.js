const QRCode = require('../models/QRCode');
const Node = require('../models/Node');

// @desc    Get NodeID by QRID
// @route   GET /api/qr/:id
// @access  Public
exports.getQRNode = async (req, res) => {
  try {
    let rawData = decodeURIComponent(req.params.id || req.query.code || req.query.qr || req.query.node || req.query.id || '').trim();

    // If query string or full URL passed in param
    const match = rawData.match(/[?&]qr=([^&#]+)/) || rawData.match(/[?&]node=([^&#]+)/);
    if (match) rawData = decodeURIComponent(match[1]).trim();

    // 1. Try exact or case-insensitive QR mapping (e.g., QR001 -> RAM-G-03)
    let qr = await QRCode.findOne({ QRID: rawData });
    if (!qr) {
      qr = await QRCode.findOne({ QRID: { $regex: new RegExp(`^${rawData}$`, 'i') } });
    }
    let targetNodeID = qr ? qr.NodeID : null;

    // 2. If no QR mapping, check direct NodeID match (e.g. RAM-F1-03)
    if (!targetNodeID) {
      const directNode = await Node.findOne({ NodeID: rawData }) ||
                         await Node.findOne({ NodeID: { $regex: new RegExp(`^${rawData}$`, 'i') } });
      if (directNode) targetNodeID = directNode.NodeID;
    }

    // 3. Strip 'QR_' prefix if present (e.g. QR_RAM-F1-03 -> RAM-F1-03)
    if (!targetNodeID && rawData.toUpperCase().startsWith('QR_')) {
      const stripped = rawData.substring(3);
      const directNode = await Node.findOne({ NodeID: { $regex: new RegExp(`^${stripped}$`, 'i') } });
      if (directNode) targetNodeID = directNode.NodeID;
    }

    // 4. Try matching by Name (exact or partial regex)
    if (!targetNodeID) {
      const nameNode = await Node.findOne({ Name: { $regex: new RegExp(`^${rawData}$`, 'i') } }) ||
                       await Node.findOne({ Name: { $regex: new RegExp(rawData, 'i') } });
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
