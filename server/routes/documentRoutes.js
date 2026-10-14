const express = require('express');
const router = express.Router();
const { uploadDocument, getGroupDocuments, deleteDocument } = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/group/:groupId', getGroupDocuments);
router.delete('/:id', deleteDocument);

module.exports = router;
