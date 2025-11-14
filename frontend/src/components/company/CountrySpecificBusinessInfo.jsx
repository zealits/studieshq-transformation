import React, { useState, useEffect } from "react";
import api from "../../api/axios";

const CountrySpecificBusinessInfo = ({ countryCode, countrySpecificFields }) => {
  const [countryFields, setCountryFields] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCountryFields = async () => {
      if (!countryCode) {
        setCountryFields(null);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get(`/api/company/country-fields/${countryCode}`);
        if (response.data.success) {
          setCountryFields(response.data.data);
        } else {
          setCountryFields(null);
        }
      } catch (error) {
        console.error("Error loading country fields:", error);
        setCountryFields(null);
      } finally {
        setLoading(false);
      }
    };

    loadCountryFields();
  }, [countryCode]);

  if (!countryCode || !countrySpecificFields || Object.keys(countrySpecificFields).length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Filter out empty values
  const fieldsWithValues = Object.entries(countrySpecificFields).filter(([key, value]) => value && value !== "");

  if (fieldsWithValues.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t">
      <h3 className="text-sm font-medium text-gray-500 mb-3">
        {countryFields?.country || "Country"}-Specific Business Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fieldsWithValues.map(([key, value]) => {
          // Find the field definition to get the label
          const fieldDef = countryFields?.fields?.find((f) => f.name === key);
          const label = fieldDef?.label || key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

          return (
            <div key={key} className="bg-gray-50 p-3 rounded-md">
              <span className="text-sm text-gray-600 block mb-1">{label}:</span>
              <span className="text-sm font-medium text-gray-900">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CountrySpecificBusinessInfo;

