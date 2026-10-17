const express = require('express');
const router = express.Router();
const {
  uploadDocument,
  getGroupDocuments,
  deleteDocument,
  downloadDocument,
} = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/group/:groupId', getGroupDocuments);
router.get('/:id/download', downloadDocument);
router.delete('/:id', deleteDocument);

module.exports = router;
