const express = require('express');
const router = express.Router();
const { getNodes, createNode, updateNode, deleteNode } = require('../controllers/nodeController');

router.route('/')
  .get(getNodes)
  .post(createNode);

router.route('/:id')
  .put(updateNode)
  .delete(deleteNode);

module.exports = router;
