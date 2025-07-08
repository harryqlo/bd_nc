const express = require('express');
const Document = require('../models/Document');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  const docs = await Document.find().populate('items.product');
  res.json(docs);
});

router.post('/', async (req, res) => {
  try {
    const doc = await Document.create(req.body);
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const doc = await Document.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Document.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
