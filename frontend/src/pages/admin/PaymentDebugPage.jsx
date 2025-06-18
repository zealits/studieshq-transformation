import React, { useState } from "react";
import { toast } from "react-hot-toast";
import escrowService from "../../services/escrowService";

const PaymentDebugPage = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("validation");

  const handleDebugFlow = async () => {
    setLoading(true);
    setLogs([]);

    try {
      const response = await fetch("/api/escrow/debug/flow", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setLogs(data.logs || []);
        toast.success("Escrow flow debugging completed successfully");
      } else {
        toast.error(data.message || "Failed to debug escrow flow");
      }
    } catch (error) {
      console.error("Error debugging flow:", error);
      toast.error("Error debugging escrow flow");
    } finally {
      setLoading(false);
    }
  };

  const handleValidatePayments = async () => {
    setLoading(true);
    setLogs([]);

    try {
      const response = await fetch("/api/escrow/validate/payments", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setLogs(data.logs || []);
        toast.success(`Payment validation completed. ${data.data?.totalFixed || 0} issues fixed.`);
      } else {
        toast.error(data.message || "Failed to validate payments");
      }
    } catch (error) {
      console.error("Error validating payments:", error);
      toast.error("Error validating payments");
    } finally {
      setLoading(false);
    }
  };

  const handleFixMilestones = async () => {
    setLoading(true);
    setLogs([]);

    try {
      const response = await fetch("/api/escrow/fix/milestones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setLogs(data.logs || []);
        toast.success("Milestone matching issues fixed successfully");
      } else {
        toast.error(data.message || "Failed to fix milestone matching");
      }
    } catch (error) {
      console.error("Error fixing milestones:", error);
      toast.error("Error fixing milestone matching");
    } finally {
      setLoading(false);
    }
  };

  const handleFixWallets = async () => {
    setLoading(true);
    setLogs([]);

    try {
      const response = await fetch("/api/escrow/fix/wallets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setLogs(data.logs || []);
        toast.success(`Wallet inconsistencies fixed: ${data.data?.walletsFixed || 0} wallets updated`);
      } else {
        toast.error(data.message || "Failed to fix wallet inconsistencies");
      }
    } catch (error) {
      console.error("Error fixing wallets:", error);
      toast.error("Error fixing wallet inconsistencies");
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseMilestonePayment = async (projectId, milestoneId) => {
    if (!projectId || !milestoneId) {
      toast.error("Please provide both Project ID and Milestone ID");
      return;
    }

    setLoading(true);

    try {
      const response = await escrowService.releaseMilestonePayment(projectId, milestoneId);

      if (response.success) {
        toast.success(`Payment released successfully: $${response.data?.transaction?.netAmount || "N/A"}`);
      } else {
        toast.error(response.message || "Failed to release payment");
      }
    } catch (error) {
      console.error("Error releasing payment:", error);
      toast.error("Error releasing milestone payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Payment System Debug & Validation</h1>
        <p className="text-gray-600">
          Use this page to debug and fix issues with the payment system, escrow flows, and milestone releases.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab("validation")}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === "validation"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Payment Validation
            </button>
            <button
              onClick={() => setActiveTab("debug")}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === "debug"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              System Debug
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === "manual"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Manual Actions
            </button>
          </nav>
        </div>
      </div>

      {/* Payment Validation Tab */}
      {activeTab === "validation" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Flow Validation</h2>
            <p className="text-gray-600 mb-4">
              This will check all completed milestones and validate that payments have been properly released to
              freelancers. It will also attempt to fix any issues found automatically.
            </p>

            <button
              onClick={handleValidatePayments}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Validating..." : "Validate & Fix Payment Flow"}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Wallet Consistency Check</h2>
            <p className="text-gray-600 mb-4">
              This will check all wallet balances against transaction records and fix any inconsistencies.
            </p>

            <button
              onClick={handleFixWallets}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Fixing..." : "Fix Wallet Inconsistencies"}
            </button>
          </div>
        </div>
      )}

      {/* System Debug Tab */}
      {activeTab === "debug" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Escrow Flow Debug</h2>
            <p className="text-gray-600 mb-4">
              This will analyze the entire escrow system, checking for orphaned escrows, milestone mismatches, and other
              potential issues.
            </p>

            <button
              onClick={handleDebugFlow}
              disabled={loading}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "Debugging..." : "Debug Escrow Flow"}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Milestone Matching Fix</h2>
            <p className="text-gray-600 mb-4">
              This will fix any milestone ID mismatches between project milestones and escrow milestones.
            </p>

            <button
              onClick={handleFixMilestones}
              disabled={loading}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? "Fixing..." : "Fix Milestone Matching"}
            </button>
          </div>
        </div>
      )}

      {/* Manual Actions Tab */}
      {activeTab === "manual" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Manual Milestone Payment Release</h2>
            <p className="text-gray-600 mb-4">
              Use this to manually release payment for a specific milestone if automatic release failed.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
                <input
                  type="text"
                  id="projectId"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter project ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Milestone ID</label>
                <input
                  type="text"
                  id="milestoneId"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter milestone ID"
                />
              </div>

              <button
                onClick={() => {
                  const projectId = document.getElementById("projectId").value;
                  const milestoneId = document.getElementById("milestoneId").value;
                  handleReleaseMilestonePayment(projectId, milestoneId);
                }}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Releasing..." : "Release Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debug Logs */}
      {logs.length > 0 && (
        <div className="mt-6">
          <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-white font-semibold">Debug Logs</h3>
              <button onClick={() => setLogs([])} className="text-gray-400 hover:text-white text-xs">
                Clear
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">Usage Instructions</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>1. Start with "Payment Flow Validation" to identify and fix most issues automatically</li>
          <li>2. Use "System Debug" to get detailed information about the escrow system</li>
          <li>3. Fix wallet inconsistencies if transactions don't match wallet balances</li>
          <li>4. Use manual payment release only for specific cases where automatic release failed</li>
          <li>5. Always check the debug logs for detailed information about what was processed</li>
        </ul>
      </div>
    </div>
  );
};

export default PaymentDebugPage;
