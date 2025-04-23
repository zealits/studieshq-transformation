import React from 'react';

const DifferenceSection = () => {
  const differenceItems = [
    {
      title: "Work Your Way",
      description: "Full flexibility, global opportunities, and smart matching—so you work on your terms, with projects that truly fit.",
      icon: (
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-secondary",
    },
    {
      title: "Secure & Transparent",
      description: "Transparent processes, milestone-based billing, and timely payments give you peace of mind on every project.",
      icon: (
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      color: "bg-primary",
    },
    {
      title: "Growth & Support",
      description: "Build your career with every project. Gain visibility, earn more, and get 24/7 support from a platform that's got your back.",
      icon: (
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: "bg-accent",
    },
  ];

  return (
    <section className="py-20 bg-background-light">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">The StudiesHQ Difference</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            What sets us apart and why freelancers and clients choose our platform
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {differenceItems.map((item, index) => (
            <div key={index} className="card relative overflow-hidden group hover:shadow-xl transition-all duration-300 border border-gray-100">
              {/* Colored corner accent */}
              <div className={`absolute top-0 right-0 w-20 h-20 ${item.color} -mr-10 -mt-10 rotate-45 transform transition-all duration-300 group-hover:scale-110`}></div>
              
              {/* Icon container */}
              <div className={`w-16 h-16 ${item.color} rounded-lg mb-6 flex items-center justify-center`}>
                {item.icon}
              </div>
              
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
              
              {/* Hover reveal element */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 overflow-hidden">
                <div className={`h-full ${item.color} transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300`}></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Additional Info */}
        <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h3 className="text-2xl font-bold mb-6">Why We Built StudiesHQ</h3>
              <p className="text-gray-600 mb-4">
                We believe in creating a marketplace that truly serves both freelancers and clients, 
                with fair terms, transparent processes, and exceptional support.
              </p>
              <p className="text-gray-600">
                Our platform is designed by people who have worked as freelancers and 
                hired talent, so we understand both sides of the marketplace and have 
                built features that address real needs.
              </p>
              
              <div className="mt-8 flex items-center">
                <img src="/images/founder-avatar.jpg" alt="Founder" className="w-12 h-12 rounded-full mr-4" />
                <div>
                  <p className="font-semibold">Sonit Singh</p>
                  <p className="text-sm text-gray-500">Founder & CEO, StudiesHQ</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <div className="bg-background-light p-6 rounded-lg flex-grow">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <span className="text-primary mr-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                    Lower Fees
                  </h4>
                  <p className="text-sm text-gray-600">
                    Our platform fee is only 10%, compared to the industry average of 20-30%
                  </p>
                </div>
                
                <div className="mt-6 bg-background-light p-6 rounded-lg flex-grow">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <span className="text-primary mr-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                    Faster Payments
                  </h4>
                  <p className="text-sm text-gray-600">
                    Get paid within 48 hours of client approval, not 7-14 days
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col">
                <div className="bg-background-light p-6 rounded-lg flex-grow">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <span className="text-primary mr-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                    24/7 Support
                  </h4>
                  <p className="text-sm text-gray-600">
                    Real humans available to help you anytime you need assistance
                  </p>
                </div>
                
                <div className="mt-6 bg-background-light p-6 rounded-lg flex-grow">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <span className="text-primary mr-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                    100% Uptime
                  </h4>
                  <p className="text-sm text-gray-600">
                    Our platform is built on reliable infrastructure with no downtime
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DifferenceSection; 