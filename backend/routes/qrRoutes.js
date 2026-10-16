const express = require('express');
const router = express.Router();
const { getQRNode, getQRCodes, createQRCode, updateQRCode, deleteQRCode } = require('../controllers/qrController');

router.get('/scan', getQRNode);
router.get('/scan/:id', getQRNode);

router.route('/')
  .get(getQRCodes)
  .post(createQRCode);

router.route('/:id')
  .put(updateQRCode)
  .delete(deleteQRCode);

module.exports = router;
