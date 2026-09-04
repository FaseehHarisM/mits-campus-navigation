const Faculty = require('../models/Faculty');

// @desc    Get all faculty
// @route   GET /api/faculty
// @access  Public
exports.getFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find({});
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create faculty
// @route   POST /api/faculty
// @access  Public
exports.createFaculty = async (req, res) => {
  try {
    const faculty = new Faculty(req.body);
    const createdFaculty = await faculty.save();
    res.status(201).json(createdFaculty);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update faculty
// @route   PUT /api/faculty/:id
// @access  Public
exports.updateFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    res.json(faculty);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete faculty
// @route   DELETE /api/faculty/:id
// @access  Public
exports.deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    res.json({ message: 'Faculty removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
