const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getFloors, createFloor, updateFloor, deleteFloor } = require('../controllers/floorController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dest = path.join(__dirname, '../../campus-navigation-main/public/maps');
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

router.route('/')
  .get(getFloors)
  .post(upload.single('MapSVGFile'), createFloor);

router.route('/:id')
  .put(updateFloor)
  .delete(deleteFloor);

module.exports = router;
