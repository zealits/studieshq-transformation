import React from "react";

const OnlineIndicator = ({ isOnline }) => {
  if (!isOnline) {
    return null;
  }

  return <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>;
};

export default OnlineIndicator;
