import api from "../api/axios";
// Get states/regions by country code
export const getStatesByCountry = async (countryCode) => {
  try {
    console.log("Fetching states by country:", countryCode);
    const response = await api.get(`/api/states/countries/${countryCode}/states`);
    console.log("States by country:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching states by country:", error);
    throw error;
  }
};

// Get all available countries with states
export const getAvailableCountries = async () => {
  try {
    const response = await api.get("/states/countries");
    return response.data;
  } catch (error) {
    console.error("Error fetching available countries:", error);
    throw error;
  }
};

// Get specific state by ISO code and country
export const getStateByIsoCode = async (countryCode, isoCode) => {
  try {
    const response = await api.get(`/states/countries/${countryCode}/states/${isoCode}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching state by ISO code:", error);
    throw error;
  }
};

// Countries that have dropdown states (from the list provided)
export const COUNTRIES_WITH_DROPDOWN_STATES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "CN", name: "China" },
  { code: "MX", name: "Mexico" },
  { code: "NZ", name: "New Zealand" },
  { code: "CA", name: "Canada" },
];

// Check if a country should use dropdown for states
export const shouldUseStateDropdown = (countryCode) => {
  return COUNTRIES_WITH_DROPDOWN_STATES.some((country) => country.code === countryCode);
};
