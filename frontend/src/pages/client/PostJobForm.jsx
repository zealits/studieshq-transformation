import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createJob, saveJobAsDraft, updateJob, publishDraftJob, fetchClientJobs } from "../../redux/slices/jobsSlice";
import { toast } from "react-hot-toast";

const PostJobForm = ({ onClose, jobToEdit }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.jobs);
  const { profile } = useSelector((state) => state.profile);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    customCategory: "",
    skills: [],
    budget: {
      min: "",
      max: "",
      type: "milestone",
      format: "range", // "fixed" or "range"
    },
    experience: "intermediate",
    duration: "less_than_1_month",
    location: "remote",
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 30 days from now
    freelancersNeeded: 1, // Add default value for number of freelancers
    status: "open", // Default status for new jobs
    verificationMandatory: false, // Default to false (optional verification)
  });

  // Initialize form data if editing an existing job
  useEffect(() => {
    if (jobToEdit) {
      // Convert skills array to comma-separated string for the form input
      const formattedSkills = jobToEdit.skills || [];

      // Handle budgetType vs type field difference
      // Check if it's a fixed budget (min === max) or range
      const isFixedBudget = jobToEdit.budget.min === jobToEdit.budget.max;
      const budget = {
        min: jobToEdit.budget.min,
        max: jobToEdit.budget.max,
        type: jobToEdit.budget.budgetType || jobToEdit.budget.type || "milestone",
        format: isFixedBudget ? "fixed" : "range",
      };

      // Check if the category is in the predefined list
      const predefinedCategories = [
        "Web Development",
        "Mobile Development",
        "UI/UX Design",
        "Graphic Design",
        "Content Writing",
        "Digital Marketing",
        "Data Analysis",
      ];

      const isCustomCategory = !predefinedCategories.includes(jobToEdit.category);

      setFormData({
        title: jobToEdit.title || "",
        description: jobToEdit.description || "",
        category: isCustomCategory ? "other" : jobToEdit.category || "",
        customCategory: isCustomCategory ? jobToEdit.category : "",
        skills: formattedSkills,
        budget,
        experience: jobToEdit.experience || "intermediate",
        duration: jobToEdit.duration || "less_than_1_month",
        location: jobToEdit.location || "remote",
        deadline: jobToEdit.deadline ? new Date(jobToEdit.deadline).toISOString().slice(0, 10) : "",
        status: jobToEdit.status || "open",
        freelancersNeeded: jobToEdit.freelancersNeeded || 1,
        verificationMandatory: jobToEdit.verificationMandatory || false,
      });
    }
  }, [jobToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "budget.min" || name === "budget.max" || name === "budget.type" || name === "budget.format") {
      const [parent, child] = name.split(".");
      setFormData((prev) => {
        const updated = {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value,
          },
        };
        
        // If format changed to fixed, set max = min
        if (child === "format" && value === "fixed" && prev.budget.min) {
          updated[parent].max = prev.budget.min;
        }
        // If format changed to range and min exists but max doesn't, keep min
        else if (child === "format" && value === "range" && prev.budget.min && !prev.budget.max) {
          updated[parent].max = prev.budget.min;
        }
        // If fixed budget and min changes, update max too
        else if (child === "min" && prev.budget.format === "fixed") {
          updated[parent].max = value;
        }
        
        return updated;
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSkillsChange = (e) => {
    const skills = e.target.value.split(",").map((skill) => skill.trim());
    setFormData((prev) => ({
      ...prev,
      skills,
    }));
  };

  const handleSaveDraft = async () => {
    try {
      const draftData = { ...formData };
      // Convert budget values to numbers
      draftData.budget.min = Number(draftData.budget.min);
      
      // For fixed budget, set max = min
      if (draftData.budget.format === "fixed") {
        draftData.budget.max = draftData.budget.min;
      } else {
        draftData.budget.max = Number(draftData.budget.max);
      }

      // Remove format field as it's not needed in the API
      delete draftData.budget.format;

      // Use custom category if "other" is selected
      if (draftData.category === "other") {
        draftData.category = draftData.customCategory;
      }
      // Remove the customCategory field as it's not needed in the API
      delete draftData.customCategory;

      if (jobToEdit) {
        await dispatch(updateJob({ jobId: jobToEdit._id, jobData: { ...draftData, status: "draft" } })).unwrap();
        toast.success("Job updated and saved as draft successfully!");
      } else {
        await dispatch(saveJobAsDraft(draftData)).unwrap();
        toast.success("Job saved as draft successfully!");
      }

      onClose();
    } catch (err) {
      toast.error(err || "Failed to save job as draft");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const jobData = { ...formData };
      // Convert budget values to numbers
      jobData.budget.min = Number(jobData.budget.min);
      
      // For fixed budget, set max = min
      if (jobData.budget.format === "fixed") {
        jobData.budget.max = jobData.budget.min;
      } else {
        jobData.budget.max = Number(jobData.budget.max);
      }

      // Remove format field as it's not needed in the API
      delete jobData.budget.format;

      // Use custom category if "other" is selected
      if (jobData.category === "other") {
        jobData.category = jobData.customCategory;
      }
      // Remove the customCategory field as it's not needed in the API
      delete jobData.customCategory;

      if (jobToEdit) {
        await dispatch(updateJob({ jobId: jobToEdit._id, jobData })).unwrap();
        toast.success("Job updated successfully!");
      } else {
        // For new jobs, set status to draft initially and publish after budget blocking
        const draftJobData = { ...jobData, status: "draft" };
        const result = await dispatch(createJob(draftJobData)).unwrap();
        const newJob = result.data.job;

        // If the intended status is not draft, publish the job (which includes budget blocking)
        if (jobData.status !== "draft") {
          try {
            await dispatch(publishDraftJob(newJob._id)).unwrap();
            // Refresh the client jobs to get the updated status
            await dispatch(fetchClientJobs());
            toast.success("Job posted successfully! Budget blocked in escrow.");
          } catch (escrowError) {
            console.error("Publishing error:", escrowError);
            toast.error(escrowError.message || "Failed to publish job. Job saved as draft.");
          }
        } else {
          toast.success("Job saved as draft!");
        }
      }

      onClose();
    } catch (err) {
      console.error("Job submission error:", err);
      toast.error(err.message || "Failed to submit job");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{jobToEdit ? "Edit Project" : "Post a New Project"}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Project Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Project Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Select a category</option>
            <option value="Web Development">Web Development</option>
            <option value="Mobile Development">Mobile Development</option>
            <option value="UI/UX Design">UI/UX Design</option>
            <option value="Graphic Design">Graphic Design</option>
            <option value="Content Writing">Content Writing</option>
            <option value="Digital Marketing">Digital Marketing</option>
            <option value="Data Analysis">Data Analysis</option>
            <option value="other">Other</option>
          </select>
        </div>

        {formData.category === "other" && (
          <div>
            <label htmlFor="customCategory" className="block text-sm font-medium text-gray-700 mb-1">
              Specify Category
            </label>
            <input
              type="text"
              id="customCategory"
              name="customCategory"
              value={formData.customCategory}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your category"
              required
            />
          </div>
        )}

        <div>
          <label htmlFor="budget.format" className="block text-sm font-medium text-gray-700 mb-1">
            Budget Type
          </label>
          <select
            id="budget.format"
            name="budget.format"
            value={formData.budget.format}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary mb-4"
          >
            <option value="range">Budget Range</option>
            <option value="fixed">Fixed Budget</option>
          </select>
        </div>

        {formData.budget.format === "fixed" ? (
          <div>
            <label htmlFor="budget.min" className="block text-sm font-medium text-gray-700 mb-1">
              Budget Amount (USD)
            </label>
            <input
              type="number"
              id="budget.min"
              name="budget.min"
              value={formData.budget.min}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
              min={1}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="budget.min" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Budget (USD)
              </label>
              <input
                type="number"
                id="budget.min"
                name="budget.min"
                value={formData.budget.min}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
                min={1}
              />
            </div>

            <div>
              <label htmlFor="budget.max" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Budget (USD)
              </label>
              <input
                type="number"
                id="budget.max"
                name="budget.max"
                value={formData.budget.max}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
                min={formData.budget.min || 1}
              />
            </div>
          </div>
        )}

        {/* Escrow Information */}
        {formData.budget.max && formData.freelancersNeeded && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Escrow Requirements</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Project Budget: ${(formData.budget.max * formData.freelancersNeeded).toLocaleString()} USD</p>
              <p>
                • Platform Fee (10%): ${(formData.budget.max * formData.freelancersNeeded * 0.1).toLocaleString()} USD
              </p>
              <p className="font-medium">
                • Total Required: ${(formData.budget.max * formData.freelancersNeeded * 1.1).toLocaleString()} USD
              </p>
              <p className="text-xs mt-2">
                This amount will be held in escrow when you hire freelancers and released upon milestone completion.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="budget.type" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Type
            </label>
            <select
              id="budget.type"
              name="budget.type"
              value={formData.budget.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="milestone">Milestone Based Payment</option>
              <option value="completion">After Completion of Project</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Choose payment method</p>
          </div>

          <div>
            <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
              Experience Level
            </label>
            <select
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="entry">Entry Level</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Required skill level</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
              Duration
            </label>
            <select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="less_than_1_month">Less than 1 month</option>
              <option value="1_to_3_months">1 to 3 months</option>
              <option value="3_to_6_months">3 to 6 months</option>
              <option value="more_than_6_months">More than 6 months</option>
            </select>
          </div>

          <div>
            <label htmlFor="freelancersNeeded" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Freelancers Needed
            </label>
            <input
              type="number"
              id="freelancersNeeded"
              name="freelancersNeeded"
              value={formData.freelancersNeeded}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="remote">Remote</option>
              <option value="onsite">Onsite</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
              Application Deadline
            </label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="verificationMandatory"
              checked={formData.verificationMandatory}
              onChange={(e) => setFormData((prev) => ({ ...prev, verificationMandatory: e.target.checked }))}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-sm font-medium text-gray-700">
              Verification Mandatory for Freelancers
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            If checked, freelancers must be verified before they can apply to this project
          </p>
        </div>

        <div>
          <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
            Required Skills (comma separated)
          </label>
          <input
            type="text"
            id="skills"
            name="skills"
            value={formData.skills.join(", ")}
            onChange={handleSkillsChange}
            placeholder="e.g., React, Node.js, MongoDB"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {jobToEdit ? "Update Project" : "Post Project"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostJobForm;
