const Floor = require('../models/Floor');

exports.getFloors = async (req, res) => {
  try {
    const floors = await Floor.find({});
    res.json(floors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const fs = require('fs');
const path = require('path');

exports.createFloor = async (req, res) => {
  try {
    const { FloorID, Name } = req.body;
    let MapSVG = req.body.MapSVG || '';
    
    // Multer places the uploaded file info in req.file
    if (req.file) {
       MapSVG = req.file.filename;
    }

    const floor = new Floor({ FloorID, Name, MapSVG });
    const createdFloor = await floor.save();
    res.status(201).json(createdFloor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateFloor = async (req, res) => {
  try {
    const floor = await Floor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(floor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteFloor = async (req, res) => {
  try {
    await Floor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Floor removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
