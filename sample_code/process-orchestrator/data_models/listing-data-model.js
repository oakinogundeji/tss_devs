'use strict';
//=============================================================================
const mongoose = require('mongoose');
//=============================================================================
const ListingSchema = mongoose.Schema({
  name: String,
  telephone: String,
  reviews: {
    type: Number,
    default: 0
  },
  address: {
    street: String,
    city: String,
    postcode: String
  },
  urls: {
    profile: String,
    email: String,
    reviews: String,
    website: String
  },
  createdOn: {
    type: Date,
    default: Date.now
  }
});
//=============================================================================
/**
 * Implement indexing by name
 */
//=============================================================================
ListingSchema.index({name: 1});
//=============================================================================
const ListingModel = mongoose.model('Listing', ListingSchema);
//=============================================================================
module.exports = ListingModel;
//=============================================================================
