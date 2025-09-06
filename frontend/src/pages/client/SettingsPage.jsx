import React, { useState } from "react";
import ChangePassword from "../../components/common/ChangePassword";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("notifications");

  // Mock notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: {
      newMessages: true,
      projectUpdates: true,
      invoiceReceipts: true,
      paymentReminders: true,
      marketingEmails: false,
    },
    siteNotifications: {
      newMessages: true,
      projectUpdates: true,
      invoiceReceipts: false,
      paymentReminders: true,
    },
  });

  // Mock visibility settings
  const [visibilitySettings, setVisibilitySettings] = useState({
    profileVisibility: "public",
    showEmail: false,
    showPhone: false,
    showCompanyDetails: true,
  });

  // Handle notification toggle changes
  const handleNotificationToggle = (e, category) => {
    const { name, checked } = e.target;
    setNotificationSettings({
      ...notificationSettings,
      [category]: {
        ...notificationSettings[category],
        [name]: checked,
      },
    });
  };

  // Handle visibility toggle changes
  const handleVisibilityToggle = (e) => {
    const { name, checked } = e.target;
    setVisibilitySettings({
      ...visibilitySettings,
      [name]: checked,
    });
  };

  // Handle visibility radio changes
  const handleVisibilityRadio = (e) => {
    const { name, value } = e.target;
    setVisibilitySettings({
      ...visibilitySettings,
      [name]: value,
    });
  };

  // Handle save settings
  const handleSaveSettings = () => {
    // API call to save settings would go here
    alert("Settings saved successfully!");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "notifications"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("notifications")}
        >
          Notifications
        </button>
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "visibility" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("visibility")}
        >
          Privacy & Visibility
        </button>
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "preferences" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("preferences")}
        >
          Preferences
        </button>
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "account" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("account")}
        >
          Account
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Email Notifications</h2>
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">New Messages</p>
                  <p className="text-sm text-gray-600">Get notified when you receive new messages from freelancers</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="newMessages"
                    className="sr-only peer"
                    checked={notificationSettings.emailNotifications.newMessages}
                    onChange={(e) => handleNotificationToggle(e, "emailNotifications")}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-light peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Project Updates</p>
                  <p className="text-sm text-gray-600">Get notified about updates to your projects</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="projectUpdates"
                    className="sr-only peer"
                    checked={notificationSettings.emailNotifications.projectUpdates}
                    onChange={(e) => handleNotificationToggle(e, "emailNotifications")}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-light peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Invoice Receipts</p>
                  <p className="text-sm text-gray-600">Get notified when you receive an invoice</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="invoiceReceipts"
                    className="sr-only peer"
                    checked={notificationSettings.emailNotifications.invoiceReceipts}
                    onChange={(e) => handleNotificationToggle(e, "emailNotifications")}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-light peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Payment Reminders</p>
                  <p className="text-sm text-gray-600">Get reminders about upcoming and overdue payments</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="paymentReminders"
                    className="sr-only peer"
                    checked={notificationSettings.emailNotifications.paymentReminders}
                    onChange={(e) => handleNotificationToggle(e, "emailNotifications")}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-light peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Marketing Emails</p>
                  <p className="text-sm text-gray-600">Receive tips, product updates, and promotional content</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="marketingEmails"
                    className="sr-only peer"
                    checked={notificationSettings.emailNotifications.marketingEmails}
                    onChange={(e) => handleNotificationToggle(e, "emailNotifications")}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-light peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-4">Site Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">New Messages</p>
                  <p className="text-sm text-gray-600">Show notifications for new messages on the platform</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="newMessages"
                    className="sr-only peer"
                    checked={notificationSettings.siteNotifications.newMessages}
                    onChange={(e) => handleNotificationToggle(e, "siteNotifications")}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-light peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Project Updates</p>
                  <p className="text-sm text-gray-600">Show notifications for project updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="projectUpdates"
                    className="sr-only peer"
                    checked={notificationSettings.siteNotifications.projectUpdates}
                    onChange={(e) => handleNotificationToggle(e, "siteNotifications")}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-light peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Invoice Receipts</p>
                  <p className="text-sm text-gray-600">Show notifications for new invoices</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="invoiceReceipts"
                    className="sr-only peer"
                    checked={notificationSettings.siteNotifications.invoiceReceipts}
                    onChange={(e) => handleNotificationToggle(e, "siteNotifications")}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-light peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Payment Reminders</p>
                  <p className="text-sm text-gray-600">Show notifications for payment reminders</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="paymentReminders"
                    className="sr-only peer"
                    checked={notificationSettings.siteNotifications.paymentReminders}
                    onChange={(e) => handleNotificationToggle(e, "siteNotifications")}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-light peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Visibility Tab */}
        {activeTab === "visibility" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Profile Visibility</h2>
            <div className="space-y-4 mb-8">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="profile-public"
                      type="radio"
                      name="profileVisibility"
                      value="public"
                      checked={visibilitySettings.profileVisibility === "public"}
                      onChange={handleVisibilityRadio}
                      className="w-4 h-4 text-primary border-gray-300 focus:ring-primary-light"
                    />
                    <label htmlFor="profile-public" className="ml-2 block font-medium text-gray-900">
                      Public
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    Your profile is visible to all users and can be found in search results.
                  </p>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center">
                    <input
                      id="profile-limited"
                      type="radio"
                      name="profileVisibility"
                      value="limited"
                      checked={visibilitySettings.profileVisibility === "limited"}
                      onChange={handleVisibilityRadio}
                      className="w-4 h-4 text-primary border-gray-300 focus:ring-primary-light"
                    />
                    <label htmlFor="profile-limited" className="ml-2 block font-medium text-gray-900">
                      Limited
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    Your profile is only visible to freelancers you've contacted or worked with.
                  </p>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center">
                    <input
                      id="profile-private"
                      type="radio"
                      name="profileVisibility"
                      value="private"
                      checked={visibilitySettings.profileVisibility === "private"}
                      onChange={handleVisibilityRadio}
                      className="w-4 h-4 text-primary border-gray-300 focus:ring-primary-light"
                    />
                    <label htmlFor="profile-private" className="ml-2 block font-medium text-gray-900">
                      Private
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    Your profile is not visible to anyone except freelancers you've hired.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Show Email Address</p>
                  <p className="text-sm text-gray-600">Allow freelancers to see your email address</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="showEmail"
                    className="sr-only peer"
                    checked={visibilitySettings.showEmail}
                    onChange={handleVisibilityToggle}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-light peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Show Phone Number</p>
                  <p className="text-sm text-gray-600">Allow freelancers to see your phone number</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="showPhone"
                    className="sr-only peer"
                    checked={visibilitySettings.showPhone}
                    onChange={handleVisibilityToggle}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-light peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Show Company Details</p>
                  <p className="text-sm text-gray-600">Make your company information visible on your profile</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="showCompanyDetails"
                    className="sr-only peer"
                    checked={visibilitySettings.showCompanyDetails}
                    onChange={handleVisibilityToggle}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-light peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === "preferences" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Account Preferences</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="language">
                  Language
                </label>
                <select
                  id="language"
                  name="language"
                  className="w-full md:w-1/3 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  defaultValue="en"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2" htmlFor="timeZone">
                  Time Zone
                </label>
                <select
                  id="timeZone"
                  name="timeZone"
                  className="w-full md:w-1/3 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  defaultValue="utc-8"
                >
                  <option value="utc-12">UTC-12:00</option>
                  <option value="utc-11">UTC-11:00</option>
                  <option value="utc-10">UTC-10:00</option>
                  <option value="utc-9">UTC-09:00</option>
                  <option value="utc-8">UTC-08:00 (Pacific Time)</option>
                  <option value="utc-7">UTC-07:00 (Mountain Time)</option>
                  <option value="utc-6">UTC-06:00 (Central Time)</option>
                  <option value="utc-5">UTC-05:00 (Eastern Time)</option>
                  <option value="utc-4">UTC-04:00</option>
                  <option value="utc-3">UTC-03:00</option>
                  <option value="utc-2">UTC-02:00</option>
                  <option value="utc-1">UTC-01:00</option>
                  <option value="utc-0">UTC±00:00</option>
                  <option value="utc+1">UTC+01:00</option>
                  <option value="utc+2">UTC+02:00</option>
                  <option value="utc+3">UTC+03:00</option>
                  <option value="utc+4">UTC+04:00</option>
                  <option value="utc+5">UTC+05:00</option>
                  <option value="utc+5.5">UTC+05:30 (India)</option>
                  <option value="utc+6">UTC+06:00</option>
                  <option value="utc+7">UTC+07:00</option>
                  <option value="utc+8">UTC+08:00 (China)</option>
                  <option value="utc+9">UTC+09:00 (Japan)</option>
                  <option value="utc+10">UTC+10:00</option>
                  <option value="utc+11">UTC+11:00</option>
                  <option value="utc+12">UTC+12:00</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2" htmlFor="currency">
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  className="w-full md:w-1/3 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  defaultValue="usd"
                >
                  <option value="usd">USD - US Dollar</option>
                  <option value="eur">EUR - Euro</option>
                  <option value="gbp">GBP - British Pound</option>
                  <option value="cad">CAD - Canadian Dollar</option>
                  <option value="aud">AUD - Australian Dollar</option>
                  <option value="jpy">JPY - Japanese Yen</option>
                  <option value="cny">CNY - Chinese Yuan</option>
                  <option value="inr">INR - Indian Rupee</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === "account" && (
          <div>
            <ChangePassword />
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={handleSaveSettings} className="btn-primary px-6 py-3 rounded-md">
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
