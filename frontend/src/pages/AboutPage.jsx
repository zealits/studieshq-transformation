import React from "react";

const AboutPage = () => {
  return (
    <div className="container-custom py-16">
      <h1 className="text-4xl font-bold mb-8">About StudiesHQ</h1>

      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
        <p className="text-lg mb-6">
          At StudiesHQ, we're on a mission to revolutionize how freelancers and clients connect, collaborate, and
          succeed together. We believe in creating a fair, transparent, and supportive marketplace where talent is
          valued and quality work is rewarded.
        </p>
        <p className="text-lg">
          Our platform is designed by people who have worked as freelancers and hired talent, so we understand both
          sides of the marketplace and have built features that address real needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold mb-4">For Freelancers</h2>
          <p className="mb-4">
            We help you find quality clients who value your expertise and pay fairly. Our platform features lower fees,
            faster payments, and tools to help you grow your business.
          </p>
          <ul className="space-y-2 list-disc pl-5">
            <li>Only 10% platform fee (vs. industry average of 20-30%)</li>
            <li>Get paid within 48 hours of milestone approval</li>
            <li>Work directly with clients without unnecessary restrictions</li>
            <li>Build your professional profile and portfolio</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold mb-4">For Clients</h2>
          <p className="mb-4">
            Find the perfect talent for your projects with our advanced matching system. Work with confidence knowing
            that our platform ensures quality and reliability.
          </p>
          <ul className="space-y-2 list-disc pl-5">
            <li>Access a global pool of pre-vetted talent</li>
            <li>Milestone-based payments for project security</li>
            <li>Transparent pricing with no hidden fees</li>
            <li>Dedicated support for your hiring needs</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <h2 className="text-2xl font-semibold mb-6">Join Our Community</h2>
        <p className="text-lg mb-8">
          Whether you're a freelancer looking for quality opportunities or a client seeking exceptional talent,
          StudiesHQ is the platform where great work happens.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/register" className="btn-primary px-8 py-3">
            Create Free Account
          </a>
          <a href="/login" className="btn-outline px-8 py-3">
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
