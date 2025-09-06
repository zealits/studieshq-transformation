import React, { useState, useEffect } from "react";
import adminService from "../../services/adminService";
import { toast } from "react-hot-toast";
import ChangePassword from "../../components/common/ChangePassword";

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState("platform");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const response = await adminService.getPlatformSettings();
        if (response.data.settings) {
          const settings = response.data.settings;
          setGeneralSettings({
            siteName: settings.platformName || "StudiesHQ",
            siteDescription: settings.siteDescription || "Connecting freelancers with clients for successful projects",
            supportEmail: settings.supportEmail || "support@studieshq.com",
            platformFee: settings.platformFee ? settings.platformFee.toString() : "10",
            maintenanceMode: settings.maintenanceMode || false,
            allowSignups: settings.allowSignups !== false,
            requireEmailVerification: settings.requireEmailVerification !== false,
          });

          setPaymentSettings({
            minimumWithdrawal: settings.minWithdrawalAmount ? settings.minWithdrawalAmount.toString() : "10",
            paymentMethods: {
              paypal: settings.allowPaymentMethods?.includes("paypal") !== false,
              stripe: settings.allowPaymentMethods?.includes("stripe") !== false,
              bankTransfer: settings.allowPaymentMethods?.includes("bank") !== false,
            },
            withdrawalFee: settings.withdrawalFee ? settings.withdrawalFee.toString() : "0",
            withdrawalProcessingDays: settings.withdrawalProcessingDays || "3-5",
            autoReleasePayment: settings.autoReleasePayment || false,
          });
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Settings data
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "StudiesHQ",
    siteDescription: "Connecting freelancers with clients for successful projects",
    supportEmail: "support@studieshq.com",
    platformFee: "10",
    maintenanceMode: false,
    allowSignups: true,
    requireEmailVerification: true,
  });

  const [paymentSettings, setPaymentSettings] = useState({
    minimumWithdrawal: "10",
    paymentMethods: {
      paypal: true,
      stripe: true,
      bankTransfer: true,
    },
    withdrawalFee: "0",
    withdrawalProcessingDays: "3-5",
    autoReleasePayment: false,
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    passwordMinLength: "8",
    requireStrongPassword: true,
    loginAttempts: "5",
    sessionTimeout: "120",
  });

  // Handle general settings change
  const handleGeneralChange = (e) => {
    const { name, type, checked, value } = e.target;
    setGeneralSettings({
      ...generalSettings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      // Prepare settings object for API
      const settingsToSave = {
        platformName: generalSettings.siteName,
        siteDescription: generalSettings.siteDescription,
        supportEmail: generalSettings.supportEmail,
        platformFee: parseFloat(generalSettings.platformFee),
        maintenanceMode: generalSettings.maintenanceMode,
        allowSignups: generalSettings.allowSignups,
        requireEmailVerification: generalSettings.requireEmailVerification,
        minWithdrawalAmount: parseFloat(paymentSettings.minimumWithdrawal),
        withdrawalFee: parseFloat(paymentSettings.withdrawalFee),
        withdrawalProcessingDays: paymentSettings.withdrawalProcessingDays,
        allowPaymentMethods: Object.keys(paymentSettings.paymentMethods).filter(
          (method) => paymentSettings.paymentMethods[method]
        ),
        autoReleasePayment: paymentSettings.autoReleasePayment,
        passwordMinLength: parseInt(securitySettings.passwordMinLength),
        requireStrongPassword: securitySettings.requireStrongPassword,
        loginAttempts: parseInt(securitySettings.loginAttempts),
        sessionTimeout: parseInt(securitySettings.sessionTimeout),
      };

      const response = await adminService.updatePlatformSettings({ settings: settingsToSave });
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(error.message || "Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  // Handle payment settings change
  const handlePaymentChange = (e) => {
    const { name, type, checked, value } = e.target;
    setPaymentSettings({
      ...paymentSettings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle payment method toggles
  const handlePaymentMethodToggle = (e) => {
    const { name, checked } = e.target;
    setPaymentSettings({
      ...paymentSettings,
      paymentMethods: {
        ...paymentSettings.paymentMethods,
        [name]: checked,
      },
    });
  };

  // Handle security settings change
  const handleSecurityChange = (e) => {
    const { name, type, checked, value } = e.target;
    setSecuritySettings({
      ...securitySettings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Platform Settings</h1>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "general" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("general")}
        >
          General
        </button>
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "payment" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("payment")}
        >
          Payment
        </button>
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "security" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("security")}
        >
          Security
        </button>
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "account" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("account")}
        >
          Account
        </button>
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "email" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("email")}
        >
          Email Templates
        </button>
      </div>

      {/* General Settings */}
      {activeTab === "general" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">General Settings</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-1">
                  Site Name
                </label>
                <input
                  type="text"
                  id="siteName"
                  name="siteName"
                  value={generalSettings.siteName}
                  onChange={handleGeneralChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="supportEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  id="supportEmail"
                  name="supportEmail"
                  value={generalSettings.supportEmail}
                  onChange={handleGeneralChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Site Description
              </label>
              <textarea
                id="siteDescription"
                name="siteDescription"
                value={generalSettings.siteDescription}
                onChange={handleGeneralChange}
                rows="3"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              ></textarea>
            </div>

            <div>
              <label htmlFor="platformFee" className="block text-sm font-medium text-gray-700 mb-1">
                Platform Fee (%)
              </label>
              <input
                type="number"
                id="platformFee"
                name="platformFee"
                value={generalSettings.platformFee}
                onChange={handleGeneralChange}
                min="0"
                max="100"
                className="w-full md:w-1/4 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  name="maintenanceMode"
                  checked={generalSettings.maintenanceMode}
                  onChange={handleGeneralChange}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-700">
                  Enable Maintenance Mode
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowSignups"
                  name="allowSignups"
                  checked={generalSettings.allowSignups}
                  onChange={handleGeneralChange}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="allowSignups" className="ml-2 block text-sm text-gray-700">
                  Allow New User Registrations
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireEmailVerification"
                  name="requireEmailVerification"
                  checked={generalSettings.requireEmailVerification}
                  onChange={handleGeneralChange}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="requireEmailVerification" className="ml-2 block text-sm text-gray-700">
                  Require Email Verification
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Settings */}
      {activeTab === "payment" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Payment Settings</h2>
          <div className="space-y-6">
            <div>
              <label htmlFor="minimumWithdrawal" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Withdrawal Amount ($)
              </label>
              <input
                type="number"
                id="minimumWithdrawal"
                name="minimumWithdrawal"
                value={paymentSettings.minimumWithdrawal}
                onChange={handlePaymentChange}
                min="0"
                className="w-full md:w-1/4 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="withdrawalFee" className="block text-sm font-medium text-gray-700 mb-1">
                Withdrawal Fee (%)
              </label>
              <input
                type="number"
                id="withdrawalFee"
                name="withdrawalFee"
                value={paymentSettings.withdrawalFee}
                onChange={handlePaymentChange}
                min="0"
                max="100"
                className="w-full md:w-1/4 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="withdrawalProcessingDays" className="block text-sm font-medium text-gray-700 mb-1">
                Withdrawal Processing Time (days)
              </label>
              <input
                type="text"
                id="withdrawalProcessingDays"
                name="withdrawalProcessingDays"
                value={paymentSettings.withdrawalProcessingDays}
                onChange={handlePaymentChange}
                className="w-full md:w-1/4 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <h3 className="text-md font-medium text-gray-700 mb-2">Payment Methods</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="paypal"
                    name="paypal"
                    checked={paymentSettings.paymentMethods.paypal}
                    onChange={handlePaymentMethodToggle}
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="paypal" className="ml-2 block text-sm text-gray-700">
                    PayPal
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="stripe"
                    name="stripe"
                    checked={paymentSettings.paymentMethods.stripe}
                    onChange={handlePaymentMethodToggle}
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="stripe" className="ml-2 block text-sm text-gray-700">
                    Stripe (Credit/Debit Cards)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="bankTransfer"
                    name="bankTransfer"
                    checked={paymentSettings.paymentMethods.bankTransfer}
                    onChange={handlePaymentMethodToggle}
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="bankTransfer" className="ml-2 block text-sm text-gray-700">
                    Bank Transfer
                  </label>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-md font-medium text-gray-700 mb-2">Escrow Settings</h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoReleasePayment"
                  name="autoReleasePayment"
                  checked={paymentSettings.autoReleasePayment}
                  onChange={handlePaymentChange}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="autoReleasePayment" className="ml-2 block text-sm text-gray-700">
                  Automatically release payments after milestone completion (Admin approval not required)
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === "security" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Security Settings</h2>
          <div className="space-y-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="twoFactorAuth"
                name="twoFactorAuth"
                checked={securitySettings.twoFactorAuth}
                onChange={handleSecurityChange}
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="twoFactorAuth" className="ml-2 block text-sm text-gray-700">
                Require Two-Factor Authentication for Admin Users
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="passwordMinLength" className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Password Length
                </label>
                <input
                  type="number"
                  id="passwordMinLength"
                  name="passwordMinLength"
                  value={securitySettings.passwordMinLength}
                  onChange={handleSecurityChange}
                  min="6"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="loginAttempts" className="block text-sm font-medium text-gray-700 mb-1">
                  Max Login Attempts Before Lockout
                </label>
                <input
                  type="number"
                  id="loginAttempts"
                  name="loginAttempts"
                  value={securitySettings.loginAttempts}
                  onChange={handleSecurityChange}
                  min="1"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700 mb-1">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  id="sessionTimeout"
                  name="sessionTimeout"
                  value={securitySettings.sessionTimeout}
                  onChange={handleSecurityChange}
                  min="1"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="requireStrongPassword"
                name="requireStrongPassword"
                checked={securitySettings.requireStrongPassword}
                onChange={handleSecurityChange}
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="requireStrongPassword" className="ml-2 block text-sm text-gray-700">
                Require Strong Passwords (including uppercase, lowercase, numbers, and special characters)
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Account Settings */}
      {activeTab === "account" && (
        <div>
          <ChangePassword />
        </div>
      )}

      {/* Email Templates */}
      {activeTab === "email" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Email Templates</h2>
          <p className="text-gray-600 mb-4">
            Customize the email templates that are sent to users. You can use placeholders like &#123;name&#125;,
            &#123;email&#125;, etc.
          </p>

          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium">Welcome Email</h3>
                <button className="text-primary hover:text-primary-dark">Edit Template</button>
              </div>
              <p className="text-sm text-gray-600">Sent to new users after registration</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium">Password Reset</h3>
                <button className="text-primary hover:text-primary-dark">Edit Template</button>
              </div>
              <p className="text-sm text-gray-600">Sent when a user requests a password reset</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium">Email Verification</h3>
                <button className="text-primary hover:text-primary-dark">Edit Template</button>
              </div>
              <p className="text-sm text-gray-600">Sent to verify a user's email address</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium">Project Award</h3>
                <button className="text-primary hover:text-primary-dark">Edit Template</button>
              </div>
              <p className="text-sm text-gray-600">Sent to freelancers when they are awarded a project</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium">Payment Confirmation</h3>
                <button className="text-primary hover:text-primary-dark">Edit Template</button>
              </div>
              <p className="text-sm text-gray-600">Sent to confirm a payment has been processed</p>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleSaveSettings}
          className="bg-primary hover:bg-primary-dark text-white py-2 px-6 rounded-md font-medium"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
