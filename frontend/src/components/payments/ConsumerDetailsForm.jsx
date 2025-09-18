import React, { useState } from "react";

const ConsumerDetailsForm = ({ onSubmit, initialData = null, isLoading = false }) => {
  const [formData, setFormData] = useState({
    givenNames: initialData?.givenNames || "",
    familyName: initialData?.familyName || "",
    emailAddress: initialData?.emailAddress || "",
    mobileNumber: initialData?.mobileNumber || "",
    address: {
      line1: initialData?.address?.line1 || "",
      line2: initialData?.address?.line2 || "",
      country: initialData?.address?.country || "",
      locality: initialData?.address?.locality || "",
      region: initialData?.address?.region || "",
      postcode: initialData?.address?.postcode || "",
    },
    title: initialData?.title || "",
    idCountry: initialData?.idCountry || "",
    idType: initialData?.idType || "",
    idNumber: initialData?.idNumber || "",
    taxNumber: initialData?.taxNumber || "",
    phoneNumber: initialData?.phoneNumber || "",
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.includes("address.")) {
      const addressField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.givenNames.trim()) {
      newErrors.givenNames = "Given names are required";
    } else if (formData.givenNames.length > 50) {
      newErrors.givenNames = "Given names must be 50 characters or less";
    }

    if (!formData.familyName.trim()) {
      newErrors.familyName = "Family name is required";
    } else if (formData.familyName.length > 20) {
      newErrors.familyName = "Family name must be 20 characters or less";
    }

    if (!formData.address.country.trim()) {
      newErrors["address.country"] = "Country is required";
    } else if (formData.address.country.length !== 2) {
      newErrors["address.country"] = "Country must be a 2-letter ISO code";
    }

    // Address Line 1 is now mandatory for complete address information
    if (!formData.address.line1.trim()) {
      newErrors["address.line1"] = "Address line 1 is required for complete address information";
    } else if (formData.address.line1.length > 70) {
      newErrors["address.line1"] = "Address line 1 must be 70 characters or less";
    }

    // Address Line 2 is now mandatory
    if (!formData.address.line2.trim()) {
      newErrors["address.line2"] = "Address line 2 is required for bank account verification";
    } else if (formData.address.line2.length > 70) {
      newErrors["address.line2"] = "Address line 2 must be 70 characters or less";
    }

    // Postal code is now mandatory
    if (!formData.address.postcode.trim()) {
      newErrors["address.postcode"] = "Postal code is required for bank account verification";
    } else if (formData.address.postcode.length > 20) {
      newErrors["address.postcode"] = "Postcode must be 20 characters or less";
    }

    // Either locality (city) or region (state) is required for complete address
    if (!formData.address.locality.trim() && !formData.address.region.trim()) {
      newErrors["address.locality"] = "Either city/locality or state/region is required";
      newErrors["address.region"] = "Either city/locality or state/region is required";
    }

    // Optional field validations
    if (formData.emailAddress && formData.emailAddress.length > 70) {
      newErrors.emailAddress = "Email address must be 70 characters or less";
    }

    if (formData.address.locality && formData.address.locality.length > 50) {
      newErrors["address.locality"] = "Locality must be 50 characters or less";
    }

    if (formData.address.region && formData.address.region.length > 50) {
      newErrors["address.region"] = "Region must be 50 characters or less";
    }

    if (formData.idCountry && formData.idCountry.length !== 2) {
      newErrors.idCountry = "ID country must be a 2-letter ISO code";
    }

    if (formData.idType && formData.idType.length > 40) {
      newErrors.idType = "ID type must be 40 characters or less";
    }

    if (formData.idNumber && formData.idNumber.length > 70) {
      newErrors.idNumber = "ID number must be 70 characters or less";
    }

    if (formData.taxNumber && formData.taxNumber.length > 30) {
      newErrors.taxNumber = "Tax number must be 30 characters or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const countries = [
    { code: "US", name: "United States" },
    { code: "CA", name: "Canada" },
    { code: "GB", name: "United Kingdom" },
    { code: "AU", name: "Australia" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "IT", name: "Italy" },
    { code: "ES", name: "Spain" },
    { code: "NL", name: "Netherlands" },
    { code: "BE", name: "Belgium" },
    { code: "AT", name: "Austria" },
    { code: "CH", name: "Switzerland" },
    { code: "DK", name: "Denmark" },
    { code: "SE", name: "Sweden" },
    { code: "NO", name: "Norway" },
    { code: "FI", name: "Finland" },
    { code: "IE", name: "Ireland" },
    { code: "LU", name: "Luxembourg" },
    { code: "PT", name: "Portugal" },
    { code: "GR", name: "Greece" },
    { code: "PL", name: "Poland" },
    { code: "CZ", name: "Czech Republic" },
    { code: "HU", name: "Hungary" },
    { code: "SK", name: "Slovakia" },
    { code: "SI", name: "Slovenia" },
    { code: "EE", name: "Estonia" },
    { code: "LV", name: "Latvia" },
    { code: "LT", name: "Lithuania" },
    { code: "MT", name: "Malta" },
    { code: "CY", name: "Cyprus" },
    { code: "BG", name: "Bulgaria" },
    { code: "RO", name: "Romania" },
    { code: "HR", name: "Croatia" },
    { code: "JP", name: "Japan" },
    { code: "SG", name: "Singapore" },
    { code: "HK", name: "Hong Kong" },
    { code: "NZ", name: "New Zealand" },
    { code: "IN", name: "India" },
    { code: "MX", name: "Mexico" },
    { code: "BR", name: "Brazil" },
    { code: "ZA", name: "South Africa" },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Consumer Details</h3>
      <p className="text-gray-600 mb-6">Please provide your personal information for bank account verification.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title (Optional)
            </label>
            <select
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select title</option>
              <option value="Mr">Mr</option>
              <option value="Mrs">Mrs</option>
              <option value="Ms">Ms</option>
              <option value="Dr">Dr</option>
              <option value="Prof">Prof</option>
            </select>
          </div>

          <div>
            <label htmlFor="givenNames" className="block text-sm font-medium text-gray-700 mb-1">
              Given Names *
            </label>
            <input
              type="text"
              id="givenNames"
              name="givenNames"
              value={formData.givenNames}
              onChange={handleInputChange}
              maxLength={50}
              className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.givenNames ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="First and middle names"
            />
            {errors.givenNames && <p className="text-red-500 text-sm mt-1">{errors.givenNames}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="familyName" className="block text-sm font-medium text-gray-700 mb-1">
              Family Name *
            </label>
            <input
              type="text"
              id="familyName"
              name="familyName"
              value={formData.familyName}
              onChange={handleInputChange}
              maxLength={20}
              className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.familyName ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Last name"
            />
            {errors.familyName && <p className="text-red-500 text-sm mt-1">{errors.familyName}</p>}
          </div>

          <div>
            <label htmlFor="emailAddress" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address (Optional)
            </label>
            <input
              type="email"
              id="emailAddress"
              name="emailAddress"
              value={formData.emailAddress}
              onChange={handleInputChange}
              maxLength={70}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="email@example.com"
            />
            {errors.emailAddress && <p className="text-red-500 text-sm mt-1">{errors.emailAddress}</p>}
          </div>
        </div>

        {/* Address Information */}
        <div className="border-t pt-4">
          <h4 className="text-md font-medium text-gray-700 mb-3">Address Information</h4>
          <p className="text-sm text-gray-600 mb-4">
            Complete address information is required for bank account verification.
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="address.line1" className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address.line1"
                name="address.line1"
                value={formData.address.line1}
                onChange={handleInputChange}
                maxLength={70}
                className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors["address.line1"] ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Street address"
              />
              {errors["address.line1"] && <p className="text-red-500 text-sm mt-1">{errors["address.line1"]}</p>}
            </div>

            <div>
              <label htmlFor="address.line2" className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address.line2"
                name="address.line2"
                value={formData.address.line2}
                onChange={handleInputChange}
                maxLength={70}
                className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors["address.line2"] ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Apartment, suite, etc."
              />
              {errors["address.line2"] && <p className="text-red-500 text-sm mt-1">{errors["address.line2"]}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="address.country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <select
                  id="address.country"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors["address.country"] ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select country</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {errors["address.country"] && <p className="text-red-500 text-sm mt-1">{errors["address.country"]}</p>}
              </div>

              <div>
                <label htmlFor="address.locality" className="block text-sm font-medium text-gray-700 mb-1">
                  City/Locality <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="address.locality"
                  name="address.locality"
                  value={formData.address.locality}
                  onChange={handleInputChange}
                  maxLength={50}
                  className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors["address.locality"] ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="City"
                />
                {errors["address.locality"] && (
                  <p className="text-red-500 text-sm mt-1">{errors["address.locality"]}</p>
                )}
              </div>

              <div>
                <label htmlFor="address.region" className="block text-sm font-medium text-gray-700 mb-1">
                  State/Region <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="address.region"
                  name="address.region"
                  value={formData.address.region}
                  onChange={handleInputChange}
                  maxLength={50}
                  className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors["address.region"] ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="State/Province"
                />
                {errors["address.region"] && <p className="text-red-500 text-sm mt-1">{errors["address.region"]}</p>}
                <p className="text-xs text-gray-500 mt-1">At least one of City/Locality or State/Region is required</p>
              </div>
            </div>

            <div>
              <label htmlFor="address.postcode" className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address.postcode"
                name="address.postcode"
                value={formData.address.postcode}
                onChange={handleInputChange}
                maxLength={20}
                className={`w-full md:w-1/3 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors["address.postcode"] ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="ZIP/Postal code"
              />
              {errors["address.postcode"] && <p className="text-red-500 text-sm mt-1">{errors["address.postcode"]}</p>}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="border-t pt-4">
          <h4 className="text-md font-medium text-gray-700 mb-3">Additional Information (Optional)</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label htmlFor="taxNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Tax Number
              </label>
              <input
                type="text"
                id="taxNumber"
                name="taxNumber"
                value={formData.taxNumber}
                onChange={handleInputChange}
                maxLength={30}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Tax identification number"
              />
              {errors.taxNumber && <p className="text-red-500 text-sm mt-1">{errors.taxNumber}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label htmlFor="idCountry" className="block text-sm font-medium text-gray-700 mb-1">
                ID Country
              </label>
              <select
                id="idCountry"
                name="idCountry"
                value={formData.idCountry}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select country</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
              {errors.idCountry && <p className="text-red-500 text-sm mt-1">{errors.idCountry}</p>}
            </div>

            <div>
              <label htmlFor="idType" className="block text-sm font-medium text-gray-700 mb-1">
                ID Type
              </label>
              <input
                type="text"
                id="idType"
                name="idType"
                value={formData.idType}
                onChange={handleInputChange}
                maxLength={40}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Passport, Driver's License"
              />
              {errors.idType && <p className="text-red-500 text-sm mt-1">{errors.idType}</p>}
            </div>

            <div>
              <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-1">
                ID Number
              </label>
              <input
                type="text"
                id="idNumber"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleInputChange}
                maxLength={70}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="ID document number"
              />
              {errors.idNumber && <p className="text-red-500 text-sm mt-1">{errors.idNumber}</p>}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Processing..." : "Continue to Bank Details"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConsumerDetailsForm;
