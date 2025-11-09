import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { reviewMilestoneWork, getMilestoneAttachments } from "../../redux/slices/projectsSlice";
import { toast } from "react-toastify";
import { format } from "date-fns";

// Global cache to prevent duplicate API calls (survives component re-mounts)
const attachmentCache = new Map();

const MilestoneReviewModal = ({ milestone, projectId, onClose, onSuccess }) => {
  const dispatch = useDispatch();

  // Add debugging logs
  console.log("MilestoneReviewModal props:", {
    milestone,
    projectId,
    milestoneId: milestone?._id,
    milestoneStatus: milestone?.status,
    hasSubmissionDetails: !!milestone?.submissionDetails,
    hasSubmissionDate: !!milestone?.submissionDate,
  });

  const [reviewData, setReviewData] = useState({
    action: "", // 'approve' or 'request_revision'
    feedback: "",
  });
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Add validation for required props
  if (!milestone || !projectId) {
    console.error("MilestoneReviewModal: Missing required props", { milestone, projectId });
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Error</h3>
          <p className="text-gray-700 mb-4">Unable to load milestone data. Please try again.</p>
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            Close
          </button>
        </div>
      </div>
    );
  }

  // Load attachments with caching to prevent duplicate API calls
  useEffect(() => {
    const milestoneKey = `${projectId}-${milestone._id}`;

    const loadAttachments = async () => {
      // Check cache first
      if (attachmentCache.has(milestoneKey)) {
        console.log("Using cached attachments for milestone:", milestoneKey);
        const cachedData = attachmentCache.get(milestoneKey);
        setAttachments(cachedData);
        setLoadingAttachments(false);
        return;
      }

      console.log("Loading fresh attachments for milestone:", milestoneKey);

      try {
        const result = await dispatch(
          getMilestoneAttachments({
            projectId,
            milestoneId: milestone._id,
          })
        ).unwrap();

        console.log("Attachments API response:", result);
        const attachmentsData = result.data?.attachments || [];

        // Cache the result
        attachmentCache.set(milestoneKey, attachmentsData);

        setAttachments(attachmentsData);
        console.log("Attachments loaded and cached, count:", attachmentsData.length);
      } catch (error) {
        console.error("Failed to load attachments:", error);

        // Show error messages
        if (error.status === 404) {
          toast.error("Project or milestone not found");
        } else if (error.status === 403) {
          toast.error("Not authorized to view attachments");
        } else {
          toast.error(`Failed to load deliverables: ${error.message || "Unknown error"}`);
        }
      } finally {
        setLoadingAttachments(false);
      }
    };

    loadAttachments();
  }, []); // Empty dependency array - only run once per mount

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reviewData.action) {
      toast.error("Please select an action");
      return;
    }

    if (reviewData.action === "request_revision" && !reviewData.feedback.trim()) {
      toast.error("Please provide feedback when requesting revision");
      return;
    }

    setSubmitting(true);

    try {
      const result = await dispatch(
        reviewMilestoneWork({
          projectId,
          milestoneId: milestone._id,
          action: reviewData.action,
          feedback: reviewData.feedback,
        })
      ).unwrap();

      // Show different success messages based on action and project completion
      if (reviewData.action === "approve") {
        if (result.data?.projectCompleted) {
          toast.success("🎉 Milestone approved and project completed! Congratulations!", {
            autoClose: 5000,
          });
        } else {
          toast.success("Milestone approved successfully!");
        }
      } else {
        toast.success("Revision requested successfully!");
      }

      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      setSubmitting(false);
      toast.error(error.message || "Failed to submit review");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (mimetype) => {
    if (mimetype.startsWith("image/")) {
      return (
        <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
            clipRule="evenodd"
          />
        </svg>
      );
    } else if (mimetype === "application/pdf") {
      return (
        <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      );
    } else {
      return (
        <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Review Work - {milestone.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Milestone Details */}
          <div>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Milestone Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Date:</span>
                  <span>{milestone.dueDate ? format(new Date(milestone.dueDate), "MMM d, yyyy") : "Not set"}</span>
                </div>
                {milestone.submissionDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Submitted:</span>
                    <span>{format(new Date(milestone.submissionDate), "MMM d, yyyy 'at' h:mm a")}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Percentage:</span>
                  <span>{milestone.percentage || 0}%</span>
                </div>
                {(milestone.revisionCount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revisions:</span>
                    <span className="text-orange-600">{milestone.revisionCount}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Work Description */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Work Description</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                {milestone.submissionDetails ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{milestone.submissionDetails}</p>
                ) : (
                  <p className="text-gray-500 italic">No work description provided</p>
                )}
              </div>
            </div>

            {/* Deliverable Files */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Deliverable Files ({attachments.length})</h4>
              {loadingAttachments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : attachments.length > 0 ? (
                <div className="space-y-3">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.mimetype)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.originalname}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)} • {format(new Date(file.uploadedAt), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No files uploaded</p>
              )}
            </div>
          </div>

          {/* Review Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Review Decision</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-green-50">
                    <input
                      type="radio"
                      name="action"
                      value="approve"
                      checked={reviewData.action === "approve"}
                      onChange={(e) => setReviewData((prev) => ({ ...prev, action: e.target.value }))}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <div>
                      <div className="font-medium text-green-800">Approve Work</div>
                      <div className="text-sm text-green-600">Mark milestone as completed and release payment</div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-orange-50">
                    <input
                      type="radio"
                      name="action"
                      value="request_revision"
                      checked={reviewData.action === "request_revision"}
                      onChange={(e) => setReviewData((prev) => ({ ...prev, action: e.target.value }))}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <div>
                      <div className="font-medium text-orange-800">Request Revision</div>
                      <div className="text-sm text-orange-600">Ask freelancer to make changes before approval</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {reviewData.action === "request_revision" ? "Feedback for Revision *" : "Feedback on Original Work"}
                </label>
                <textarea
                  value={reviewData.feedback}
                  onChange={(e) => setReviewData((prev) => ({ ...prev, feedback: e.target.value }))}
                  placeholder={
                    reviewData.action === "request_revision"
                      ? "Please explain what needs to be changed..."
                      : "Great work! Any additional comments..."
                  }
                  rows="4"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={reviewData.action === "request_revision"}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reviewData.action}
                  className={`px-6 py-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
                    reviewData.action === "approve"
                      ? "bg-green-600 hover:bg-green-700"
                      : reviewData.action === "request_revision"
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-gray-400"
                  }`}
                >
                  {submitting
                    ? "Submitting..."
                    : reviewData.action === "approve"
                    ? "Approve & Complete"
                    : reviewData.action === "request_revision"
                    ? "Request Revision"
                    : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilestoneReviewModal;
