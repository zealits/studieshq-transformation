{
  jobs.map((job) => (
    <div key={job._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
          <p className="text-sm text-gray-500 mt-1">Posted {formatDate(job.createdAt)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Budget</p>
          <p className="font-medium">
            ${job.budget.min} - ${job.budget.max}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Applications</p>
          <p className="font-medium">{job.applicationCount}</p>
        </div>
      </div>

      <div className="mt-4 flex space-x-3">
        <Link
          to={`/client/jobs/${job._id}/proposals`}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          View Proposals({job.applicationCount})
        </Link>
        <Link
          to={`/client/jobs/${job._id}/edit`}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Edit Job
        </Link>
      </div>
    </div>
  ));
}
