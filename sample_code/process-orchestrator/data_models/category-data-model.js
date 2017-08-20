'use strict';
//=============================================================================
const mongoose = require('mongoose');
//=============================================================================
const CategorySchema = mongoose.Schema({
  category: String,
  url: String,
  createdOn: {
    type: Date,
    default: Date.now
  }
});
//=============================================================================
/**
 * Implement indexing by category
 */
//=============================================================================
CategorySchema.index({category: 1});
CategorySchema.index({url: 1});
//=============================================================================
const CategoryModel = mongoose.model('Category', CategorySchema);
//=============================================================================
module.exports = CategoryModel;
//=============================================================================
