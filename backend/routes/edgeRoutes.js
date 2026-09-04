const express = require('express');
const router = express.Router();
const { getEdges, createEdge, updateEdge, deleteEdge } = require('../controllers/edgeController');

router.route('/')
  .get(getEdges)
  .post(createEdge);

router.route('/:id')
  .put(updateEdge)
  .delete(deleteEdge);

module.exports = router;
