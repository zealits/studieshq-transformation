const StateRegion = require("../models/StateRegion");

// Get states/regions by country code
const getStatesByCountry = async (req, res) => {
  try {
    const { countryCode } = req.params;
    console.log("Country code:", countryCode);
    if (!countryCode) {
      return res.status(400).json({
        success: false,
        message: "Country code is required",
      });
    }

    // Validate country code format (2-letter ISO code)
    if (countryCode.length !== 2) {
      return res.status(400).json({
        success: false,
        message: "Country code must be a 2-letter ISO code",
      });
    }

    const states = await StateRegion.find({ countryCode: countryCode.toUpperCase() })
      .select("name isoCode countryName")
      .sort({ name: 1 });

    if (states.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No states/regions found for country code: ${countryCode}`,
      });
    }

    res.status(200).json({
      success: true,
      data: states,
      count: states.length,
    });
  } catch (error) {
    console.error("Error fetching states by country:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all available countries with states
const getAvailableCountries = async (req, res) => {
  try {
    const countries = await StateRegion.aggregate([
      {
        $group: {
          _id: {
            countryCode: "$countryCode",
            countryName: "$countryName",
          },
          stateCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          countryCode: "$_id.countryCode",
          countryName: "$_id.countryName",
          stateCount: 1,
        },
      },
      {
        $sort: { countryName: 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: countries,
      count: countries.length,
    });
  } catch (error) {
    console.error("Error fetching available countries:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get state by ISO code and country
const getStateByIsoCode = async (req, res) => {
  try {
    const { countryCode, isoCode } = req.params;

    if (!countryCode || !isoCode) {
      return res.status(400).json({
        success: false,
        message: "Both country code and ISO code are required",
      });
    }

    const state = await StateRegion.findOne({
      countryCode: countryCode.toUpperCase(),
      isoCode: isoCode.toUpperCase(),
    }).select("name isoCode countryName countryCode");

    if (!state) {
      return res.status(404).json({
        success: false,
        message: `State not found for country: ${countryCode}, ISO: ${isoCode}`,
      });
    }

    res.status(200).json({
      success: true,
      data: state,
    });
  } catch (error) {
    console.error("Error fetching state by ISO code:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  getStatesByCountry,
  getAvailableCountries,
  getStateByIsoCode,
};
