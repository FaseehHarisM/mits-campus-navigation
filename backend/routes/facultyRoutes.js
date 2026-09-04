const express = require('express');
const router = express.Router();
const { getFaculty, createFaculty, updateFaculty, deleteFaculty } = require('../controllers/facultyController');

router.route('/')
  .get(getFaculty)
  .post(createFaculty);

router.route('/:id')
  .put(updateFaculty)
  .delete(deleteFaculty);

module.exports = router;
