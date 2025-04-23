import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="container-custom flex flex-col items-center justify-center min-h-[70vh] py-12 text-center">
      <h1 className="text-9xl font-bold text-primary">404</h1>
      <h2 className="text-3xl font-bold mt-4 mb-6">Page Not Found</h2>
      <p className="text-xl text-gray-600 max-w-md mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-4">
        <Link to="/" className="btn-primary px-6 py-3">
          Go Home
        </Link>
        <Link to="/contact" className="btn-outline px-6 py-3">
          Contact Support
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
