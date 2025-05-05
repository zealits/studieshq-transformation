import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { submitProposal } from "../../redux/slices/jobsSlice";
import { toast } from "react-hot-toast";

const ApplyJobModal = ({ job, onClose }) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.jobs);
  const [formData, setFormData] = useState({
    bidPrice: "",
    coverLetter: "",
    estimatedDuration: "less_than_1_month", // Default value
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data
    if (!formData.bidPrice || !formData.coverLetter || !formData.estimatedDuration) {
      toast.error("Please fill all required fields");
      return;
    }

    // Convert bidPrice to number
    const proposalData = {
      ...formData,
      bidPrice: parseFloat(formData.bidPrice),
    };

    try {
      await dispatch(submitProposal({ jobId: job._id, proposalData })).unwrap();
      toast.success("Proposal submitted successfully");
      onClose();
    } catch (error) {
      toast.error(error || "Failed to submit proposal");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-2xl font-semibold">Apply to Job</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 focus:outline-none">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          {/* Job Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg text-gray-800">{job.title}</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {job.skills.map((skill, index) => (
                <span key={index} className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {skill}
                </span>
              ))}
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <p>
                Budget:{" "}
                {job.budget.type === "fixed"
                  ? `$${job.budget.min} - $${job.budget.max}`
                  : `$${job.budget.min} - $${job.budget.max}/hr`}
              </p>
            </div>
          </div>

          {/* Application Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="bidPrice" className="block text-sm font-medium text-gray-700 mb-1">
                Bid Price ($)
              </label>
              <input
                type="number"
                id="bidPrice"
                name="bidPrice"
                value={formData.bidPrice}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                placeholder="Enter your bid amount"
                required
                min={1}
              />
              {job.budget && (
                <p className="text-xs text-gray-500 mt-1">
                  Suggested budget: ${job.budget.min} - ${job.budget.max}
                  {job.budget.type === "hourly" ? "/hr" : ""}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="estimatedDuration" className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Duration
              </label>
              <select
                id="estimatedDuration"
                name="estimatedDuration"
                value={formData.estimatedDuration}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                required
              >
                <option value="less_than_1_month">Less than 1 month</option>
                <option value="1_to_3_months">1-3 months</option>
                <option value="3_to_6_months">3-6 months</option>
                <option value="more_than_6_months">More than 6 months</option>
              </select>
            </div>

            <div>
              <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-1">
                Proposal Message
              </label>
              <textarea
                id="coverLetter"
                name="coverLetter"
                value={formData.coverLetter}
                onChange={handleChange}
                rows={5}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                placeholder="Tell the client why you're the best fit for this job..."
                required
              ></textarea>
              <p className="text-xs text-gray-500 mt-1">
                Your profile details including skills and experience will be automatically included with your
                application.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Submitting..." : "Submit Proposal"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplyJobModal;
