'use strict';
//=============================================================================
const mongoose = require('mongoose');
//=============================================================================
const PageSchema = mongoose.Schema({
  category: String,
  url: String,
  pages: [String],
  createdOn: {
    type: Date,
    default: Date.now
  }
});
//=============================================================================
/**
 * Implement indexing by category and url
 */
//=============================================================================
PageSchema.index({category: 1});
PageSchema.index({url: 1});
//=============================================================================
const PageModel = mongoose.model('Page', PageSchema);
//=============================================================================
module.exports = PageModel;
//=============================================================================
