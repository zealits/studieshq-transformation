/**
 * Utility functions for consistent currency formatting
 */

/**
 * Format a number as USD currency
 * @param {number} amount - The amount to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export const formatUSD = (amount, options = {}) => {
  const { minimumFractionDigits = 0, maximumFractionDigits = 2, showCurrencyCode = true } = options;

  if (amount === null || amount === undefined || isNaN(amount)) {
    return "N/A";
  }

  const formatted = new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);

  return showCurrencyCode ? `$${formatted} USD` : `$${formatted}`;
};

/**
 * Format a budget range as USD currency
 * @param {object} budget - Budget object with min and max properties
 * @param {object} options - Formatting options
 * @returns {string} Formatted budget range string
 */
export const formatBudgetRange = (budget, options = {}) => {
  if (!budget || !budget.min || !budget.max) {
    return "N/A";
  }

  const { showCurrencyCode = true } = options;
  const currency = showCurrencyCode ? " USD" : "";

  return `$${budget.min.toLocaleString()} - $${budget.max.toLocaleString()}${currency}`;
};

/**
 * Format hourly rate as USD currency
 * @param {number|object} rate - Hourly rate (number) or rate object with min/max
 * @param {object} options - Formatting options
 * @returns {string} Formatted hourly rate string
 */
export const formatHourlyRate = (rate, options = {}) => {
  const { showCurrencyCode = true } = options;
  const currency = showCurrencyCode ? " USD" : "";

  if (!rate) {
    return "Not specified";
  }

  if (typeof rate === "object" && rate.min && rate.max) {
    return `$${rate.min} - $${rate.max}${currency}/hr`;
  }

  if (typeof rate === "number") {
    return `$${rate}${currency}/hr`;
  }

  return "Not specified";
};

/**
 * Format percentage as string
 * @param {number} percentage - The percentage to format
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (percentage) => {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return "0%";
  }

  return `${percentage.toFixed(1)}%`;
};
