import React from "react";

const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      title: "Create Your Account",
      description: "Sign up for free and set up your profile with your skills, portfolio, and experience.",
      icon: (
        <svg
          className="w-12 h-12 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      number: "02",
      title: "Find Opportunities",
      description: "Browse projects that match your skills or receive personalized job recommendations.",
      icon: (
        <svg
          className="w-12 h-12 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
    },
    {
      number: "03",
      title: "Submit Proposals",
      description: "Send compelling proposals to clients outlining how you can help with their projects.",
      icon: (
        <svg
          className="w-12 h-12 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      number: "04",
      title: "Collaborate & Get Paid",
      description: "Work on projects through our secure platform and receive payment for completed milestones.",
      icon: (
        <svg
          className="w-12 h-12 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How StudiesHQ Works</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our streamlined process makes it easy to find work or hire talent
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Step Number */}
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary-light bg-opacity-20 flex items-center justify-center text-primary font-bold">
                {step.number}
              </div>

              <div className="card h-full flex flex-col items-center text-center pt-12">
                <div className="mb-6 text-primary">{step.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>

                {/* Connector line (except for last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-8 w-8 h-0.5 bg-gray-300"></div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-lg mb-6">Ready to start your journey with StudiesHQ?</p>
          <a href="/register" className="btn-primary px-8 py-3 inline-block">
            Join Now
          </a>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
