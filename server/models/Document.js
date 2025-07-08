const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  docType: String,
  date: Date,
  supplier: String,
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number
  }]
});

module.exports = mongoose.model('Document', documentSchema);
