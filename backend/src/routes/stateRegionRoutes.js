const express = require("express");
const router = express.Router();
const {
  getStatesByCountry,
  getAvailableCountries,
  getStateByIsoCode,
} = require("../controllers/stateRegionController");

// Get states/regions by country code
router.get("/countries/:countryCode/states", getStatesByCountry);

// Get all available countries with states
router.get("/countries", getAvailableCountries);

// Get specific state by ISO code and country
router.get("/countries/:countryCode/states/:isoCode", getStateByIsoCode);

module.exports = router;
