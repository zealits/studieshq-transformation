import React from "react";
import { Link } from "react-router-dom";

const AboutPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-white">
        <div className="absolute inset-0 bg-gradient-to-r from-[#3884b8]/10 to-[#0d81c8]/10"></div>
        <div className="container-custom relative py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[#3884b8] mb-6">About StudiesHQ</h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Empowering freelancers and businesses to connect, collaborate, and succeed in the digital economy
            </p>
          </div>
        </div>
      </section>

      <div className="container-custom py-16">
        {/* Our Story Section */}
        <div className="bg-white rounded-xl shadow-lg p-10 mb-16">
          <h2 className="text-3xl font-bold mb-8 text-[#3884b8]">Our Story</h2>
          <div className="space-y-6">
            <p className="text-lg text-gray-700 leading-relaxed">
              StudiesHQ, backed by Agile Labs, was built to bridge the gap between skilled professionals and businesses
              seeking reliable freelance talent. In a rapidly evolving digital economy, we saw the need for a platform
              that prioritizes trust, transparency, and efficiency—making freelance collaboration easier and more
              rewarding for everyone involved.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              We empower freelancers to find meaningful work that aligns with their skills, and help employers connect
              with verified talent they can trust. With intuitive tools, secure workflows, and smart matching, StudiesHQ
              streamlines the way work gets done—faster, better, and with lasting impact. Whether you're a freelancer
              building your career or a business scaling your team, StudiesHQ is your trusted partner in the new world
              of work.
            </p>
          </div>
        </div>

        {/* Mission & Vision Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-lg p-10">
            <h2 className="text-2xl font-bold mb-6 text-[#0d81c8]">Our Mission</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              At StudiesHQ, our mission is to revolutionize how skilled freelancers and forward-thinking employers
              connect, collaborate, and succeed. We're building a trusted, secure, and efficient platform that values
              talent, rewards quality work, and creates a fair, transparent marketplace for modern
              collaboration—designed by those who understand both sides of the freelance experience.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-10">
            <h2 className="text-2xl font-bold mb-6 text-[#0d81c8]">Our Vision</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              To be the leading platform where professionals and businesses worldwide connect to deliver high-impact
              work, grow careers, and build lasting partnerships.
            </p>
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-white rounded-xl shadow-lg p-10 mb-16">
          <h2 className="text-3xl font-bold mb-12 text-[#3884b8] text-center">What We Stand For</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Trust & Transparency",
                description:
                  "We believe in open communication, fair practices, and mutual respect between freelancers and clients.",
                icon: (
                  <svg className="w-12 h-12 text-[#3884b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                ),
              },
              {
                title: "Flexibility",
                description: "We support working on your own terms—whether you're hiring or freelancing.",
                icon: (
                  <svg className="w-12 h-12 text-[#3884b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
              },
              {
                title: "Quality First",
                description:
                  "From platform experience to talent pool, we're committed to delivering high standards at every touchpoint.",
                icon: (
                  <svg className="w-12 h-12 text-[#3884b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                ),
              },
              {
                title: "Innovation",
                description: "Our tools evolve with your needs—powered by intelligent matching and secure workflows.",
                icon: (
                  <svg className="w-12 h-12 text-[#3884b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                ),
              },
              {
                title: "Growth Mindset",
                description: "We create space for individuals and businesses to scale, learn, and succeed.",
                icon: (
                  <svg className="w-12 h-12 text-[#3884b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                    />
                  </svg>
                ),
              },
            ].map((value, index) => (
              <div
                key={index}
                className="p-8 border border-gray-100 rounded-xl hover:shadow-lg transition-all duration-300 hover:border-[#3884b8]/20"
              >
                <div className="mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-[#0d81c8]">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div className="bg-white rounded-xl shadow-lg p-10 mb-16">
          <h2 className="text-3xl font-bold mb-8 text-[#3884b8] text-center">Why Partner With Us?</h2>
          <p className="text-lg text-gray-700 mb-12 text-center max-w-4xl mx-auto">
            StudiesHQ combines smart technology with a human-first approach to redefine freelance collaboration. Our
            platform connects businesses with verified talent and freelancers with high-quality projects—securely and
            seamlessly.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-8 rounded-xl">
              <h3 className="text-2xl font-semibold mb-6 text-[#0d81c8]">For Freelancers</h3>
              <p className="text-gray-700 mb-6">
                We help you find quality clients who value your expertise and pay fairly. Our platform features lower
                fees, faster payments, and tools to help you grow your business.
              </p>
              <ul className="space-y-4">
                {[
                  "Only 10% platform fee (vs. industry average of 20-30%)",
                  "Get paid within 48 hours of milestone approval",
                  "Work directly with clients without unnecessary restrictions",
                  "Build your professional profile and portfolio",
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-[#3884b8] mr-3">✓</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-50 p-8 rounded-xl">
              <h3 className="text-2xl font-semibold mb-6 text-[#0d81c8]">For Clients</h3>
              <p className="text-gray-700 mb-6">
                Find the perfect talent for your projects with our advanced matching system. Work with confidence
                knowing that our platform ensures quality and reliability.
              </p>
              <ul className="space-y-4">
                {[
                  "Access a global pool of pre-vetted talent",
                  "Milestone-based payments for project security",
                  "Transparent pricing with no hidden fees",
                  "Dedicated support for your hiring needs",
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-[#3884b8] mr-3">✓</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#3884b8] to-[#0d81c8] rounded-xl shadow-lg p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-6">Join Our Community</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Whether you're a freelancer looking for quality opportunities or a client seeking exceptional talent,
            StudiesHQ is the platform where great work happens.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-white text-[#3884b8] rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
