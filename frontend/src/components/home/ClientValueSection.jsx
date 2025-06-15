import React from "react";
import ClientValue from "../../assets/images/ClientValue.jpg";

const ClientValueSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 hidden lg:block">
            <div className="relative">
              <div className="absolute -top-6 -left-6 w-20 h-20 bg-[#3884b8] rounded-lg opacity-10"></div>
              <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-[#0d81c8] rounded-lg opacity-10"></div>

              <img
                src={ClientValue}
                alt="Work with quality clients"
                className="w-full rounded-lg shadow-xl"
              />
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#3884b8]">Work with Clients Who Value You</h2>

            <p className="text-lg text-gray-700 mb-8">
              We make it easy for freelancers to work with companies that value your time, expertise, and creativity—on
              meaningful projects with teams who appreciate great work.
            </p>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 bg-[#3884b8] bg-opacity-10 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-[#0d81c8]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold mb-2 text-[#0d81c8]">Aligned Opportunities</h3>
                  <p className="text-gray-600">
                    Choose projects that match your values, interests, and professional goals
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 bg-[#3884b8] bg-opacity-10 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-[#0d81c8]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold mb-2 text-[#0d81c8]">Trusted Collaborations</h3>
                  <p className="text-gray-600">Connect with clients who are clear, professional, and ready to work</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 bg-[#3884b8] bg-opacity-10 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-[#0d81c8]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold mb-2 text-[#0d81c8]">Global Network</h3>
                  <p className="text-gray-600">Access work from companies across diverse industries and regions</p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-[#3884b8] mb-1">85%</p>
                <p className="text-sm text-gray-600">Long-term client relationships</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-[#3884b8] mb-1">92%</p>
                <p className="text-sm text-gray-600">Client satisfaction rate</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-[#3884b8] mb-1">70%</p>
                <p className="text-sm text-gray-600">Repeat client opportunity</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClientValueSection;
