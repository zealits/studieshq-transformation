/**
 * Format a date string into a human-readable format
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return "";

  const d = new Date(date);
  
  // Check if date is valid
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const diffTime = Math.abs(now - d);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffTime / (1000 * 60));

  // If less than a minute ago
  if (diffMinutes < 1) {
    return "just now";
  }
  
  // If less than an hour ago
  if (diffHours < 1) {
    return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
  }
  
  // If less than a day ago
  if (diffDays < 1) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  }
  
  // If less than a week ago
  if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  }

  // For dates more than a week old, show the actual date
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}; 