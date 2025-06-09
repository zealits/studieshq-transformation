import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  submitMilestoneWork,
  uploadMilestoneDeliverables,
  resubmitMilestoneWork,
} from "../../redux/slices/projectsSlice";
import { toast } from "react-toastify";

const MilestoneWorkSubmission = ({ milestone, projectId, isResubmission = false, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const [submissionData, setSubmissionData] = useState({
    submissionDetails: isResubmission ? milestone.submissionDetails || "" : "",
    files: [],
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Validate file sizes (50MB max each)
    const oversizedFiles = selectedFiles.filter((file) => file.size > 50 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`Files too large: ${oversizedFiles.map((f) => f.name).join(", ")}. Max size is 50MB per file.`);
      return;
    }

    setSubmissionData((prev) => ({
      ...prev,
      files: [...prev.files, ...selectedFiles],
    }));
  };

  const removeFile = (index) => {
    setSubmissionData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!submissionData.submissionDetails.trim()) {
      toast.error("Please provide work description");
      return;
    }

    setSubmitting(true);
    setUploading(true);

    try {
      let attachmentUrls = [];

      // Upload files if any
      if (submissionData.files.length > 0) {
        const uploadResult = await dispatch(uploadMilestoneDeliverables(submissionData.files)).unwrap();
        attachmentUrls = uploadResult.data.files;
      }

      setUploading(false);

      // Submit work
      const submitAction = isResubmission ? resubmitMilestoneWork : submitMilestoneWork;
      await dispatch(
        submitAction({
          projectId,
          milestoneId: milestone._id,
          submissionDetails: submissionData.submissionDetails,
          attachmentUrls,
        })
      ).unwrap();

      toast.success(isResubmission ? "Work resubmitted successfully!" : "Work submitted successfully!");
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      setUploading(false);
      setSubmitting(false);
      toast.error(error.message || "Failed to submit work");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">
            {isResubmission ? "Resubmit Work" : "Submit Work"} - {milestone.title}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isResubmission && milestone.feedback && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="font-medium text-yellow-800 mb-2">Client Feedback:</h4>
            <p className="text-yellow-700">{milestone.feedback}</p>
            {milestone.revisionCount && (
              <p className="text-sm text-yellow-600 mt-2">Revision #{milestone.revisionCount}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Work Description *</label>
            <textarea
              value={submissionData.submissionDetails}
              onChange={(e) => setSubmissionData((prev) => ({ ...prev, submissionDetails: e.target.value }))}
              placeholder="Describe the work you've completed, what was delivered, and any important notes..."
              rows="6"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Provide detailed information about your deliverables and any special instructions for the client.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Deliverables</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Click to upload files or drag and drop
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      PDF, DOC, DOCX, XLS, XLSX, ZIP, RAR, JPG, PNG up to 50MB each
                    </span>
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </div>
              </div>
            </div>

            {submissionData.files.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-gray-700">Selected Files:</h4>
                {submissionData.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              disabled={submitting || uploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading
                ? "Uploading..."
                : submitting
                ? "Submitting..."
                : isResubmission
                ? "Resubmit Work"
                : "Submit Work"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MilestoneWorkSubmission;
