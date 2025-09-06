import React, { useState } from "react";
import ChangePassword from "../../components/common/ChangePassword";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("notifications");

  // Mock notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: {
      newJobAlerts: true,
      proposalUpdates: true,
      projectUpdates: true,
      paymentNotifications: true,
      messageNotifications: true,
      marketingEmails: false,
    },
    siteNotifications: {
      newJobAlerts: true,
      messageNotifications: true,
      projectDeadlines: true,
      paymentNotifications: true,
    },
  });

  // Mock privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    showEarnings: false,
    showLocation: true,
    showOnlineStatus: true,
    allowDirectContact: true,
  });

  // Mock work preferences
  const [workPreferences, setWorkPreferences] = useState({
    availableHours: "40",
    hourlyRate: "50",
    workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    preferredProjectSize: "medium",
    categories: ["Web Development", "Mobile Development", "UI/UX Design"],
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

  // Handle privacy toggle changes
  const handlePrivacyChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPrivacySettings({
      ...privacySettings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle work preference changes
  const handleWorkPreferenceChange = (e) => {
    const { name, value } = e.target;
    setWorkPreferences({ ...workPreferences, [name]: value });
  };

  // Handle working day toggle
  const handleWorkingDayToggle = (day) => {
    const updatedDays = workPreferences.workingDays.includes(day)
      ? workPreferences.workingDays.filter((d) => d !== day)
      : [...workPreferences.workingDays, day];
    setWorkPreferences({ ...workPreferences, workingDays: updatedDays });
  };

  // Handle save settings
  const handleSaveSettings = () => {
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
            activeTab === "privacy" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("privacy")}
        >
          Privacy & Visibility
        </button>
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "work" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("work")}
        >
          Work Preferences
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
                  <p className="font-medium">New Job Alerts</p>
                  <p className="text-sm text-gray-600">Get notified when new jobs matching your skills are posted</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="newJobAlerts"
                    className="sr-only peer"
                    checked={notificationSettings.emailNotifications.newJobAlerts}
                    onChange={(e) => handleNotificationToggle(e, "emailNotifications")}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-light peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Proposal Updates</p>
                  <p className="text-sm text-gray-600">Get notified about updates to your job proposals</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="proposalUpdates"
                    className="sr-only peer"
                    checked={notificationSettings.emailNotifications.proposalUpdates}
                    onChange={(e) => handleNotificationToggle(e, "emailNotifications")}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-light peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Project Updates</p>
                  <p className="text-sm text-gray-600">Get notified about updates to your active projects</p>
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
                  <p className="font-medium">Payment Notifications</p>
                  <p className="text-sm text-gray-600">Get notified when you receive payments or invoices</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="paymentNotifications"
                    className="sr-only peer"
                    checked={notificationSettings.emailNotifications.paymentNotifications}
                    onChange={(e) => handleNotificationToggle(e, "emailNotifications")}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-light peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Message Notifications</p>
                  <p className="text-sm text-gray-600">Get notified when you receive new messages from clients</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="messageNotifications"
                    className="sr-only peer"
                    checked={notificationSettings.emailNotifications.messageNotifications}
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
                  <p className="font-medium">New Job Alerts</p>
                  <p className="text-sm text-gray-600">Show notifications for new matching jobs on the platform</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="newJobAlerts"
                    className="sr-only peer"
                    checked={notificationSettings.siteNotifications.newJobAlerts}
                    onChange={(e) => handleNotificationToggle(e, "siteNotifications")}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-light peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Message Notifications</p>
                  <p className="text-sm text-gray-600">Show notifications for new messages</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="messageNotifications"
                    className="sr-only peer"
                    checked={notificationSettings.siteNotifications.messageNotifications}
                    onChange={(e) => handleNotificationToggle(e, "siteNotifications")}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-light peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Project Deadlines</p>
                  <p className="text-sm text-gray-600">Show notifications for upcoming project deadlines</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="projectDeadlines"
                    className="sr-only peer"
                    checked={notificationSettings.siteNotifications.projectDeadlines}
                    onChange={(e) => handleNotificationToggle(e, "siteNotifications")}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-light peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Payment Notifications</p>
                  <p className="text-sm text-gray-600">Show notifications for payment updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="paymentNotifications"
                    className="sr-only peer"
                    checked={notificationSettings.siteNotifications.paymentNotifications}
                    onChange={(e) => handleNotificationToggle(e, "siteNotifications")}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-light peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Privacy & Visibility Tab */}
        {activeTab === "privacy" && (
          <div>
            <h2 className="text-lg font-semibold mb-6">Privacy & Visibility Settings</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Profile Visibility</label>
                <div className="space-y-2">
                  {[
                    { value: "public", label: "Public", description: "Anyone can view your profile" },
                    {
                      value: "private",
                      label: "Private",
                      description: "Only clients you've worked with can see your profile",
                    },
                    {
                      value: "StudiesHQ_only",
                      label: "StudiesHQ Only",
                      description: "Only visible to StudiesHQ users",
                    },
                  ].map((option) => (
                    <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="profileVisibility"
                        value={option.value}
                        checked={privacySettings.profileVisibility === option.value}
                        onChange={handlePrivacyChange}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    key: "showEarnings",
                    title: "Show Earnings",
                    description: "Display your total earnings on your profile",
                  },
                  {
                    key: "showLocation",
                    title: "Show Location",
                    description: "Display your location on your profile",
                  },
                  {
                    key: "showOnlineStatus",
                    title: "Show Online Status",
                    description: "Let clients see when you're online",
                  },
                  {
                    key: "allowDirectContact",
                    title: "Allow Direct Contact",
                    description: "Allow clients to contact you directly outside of projects",
                  },
                ].map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">{setting.title}</p>
                      <p className="text-sm text-gray-600">{setting.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name={setting.key}
                        className="sr-only peer"
                        checked={privacySettings[setting.key]}
                        onChange={handlePrivacyChange}
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-light peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Work Preferences Tab */}
        {activeTab === "work" && (
          <div>
            <h2 className="text-lg font-semibold mb-6">Work Preferences</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available Hours per Week</label>
                  <select
                    name="availableHours"
                    value={workPreferences.availableHours}
                    onChange={handleWorkPreferenceChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="10">Less than 10 hours</option>
                    <option value="20">10-20 hours</option>
                    <option value="30">20-30 hours</option>
                    <option value="40">30-40 hours</option>
                    <option value="40+">More than 40 hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate (USD)</label>
                  <input
                    type="number"
                    name="hourlyRate"
                    value={workPreferences.hourlyRate}
                    onChange={handleWorkPreferenceChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    min="5"
                    max="500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Working Days</label>
                <div className="flex flex-wrap gap-2">
                  {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                    <button
                      key={day}
                      onClick={() => handleWorkingDayToggle(day)}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        workPreferences.workingDays.includes(day)
                          ? "bg-primary text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Project Size</label>
                <select
                  name="preferredProjectSize"
                  value={workPreferences.preferredProjectSize}
                  onChange={handleWorkPreferenceChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="small">Small ($100 - $1,000)</option>
                  <option value="medium">Medium ($1,000 - $5,000)</option>
                  <option value="large">Large ($5,000+)</option>
                  <option value="any">Any Size</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Preferred Categories</label>
                <div className="flex flex-wrap gap-2">
                  {workPreferences.categories.map((category, index) => (
                    <span
                      key={index}
                      className="bg-primary text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                    >
                      <span>{category}</span>
                      <button className="text-white hover:text-gray-200">×</button>
                    </span>
                  ))}
                  <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-300">
                    + Add Category
                  </button>
                </div>
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
        <button
          onClick={handleSaveSettings}
          className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
