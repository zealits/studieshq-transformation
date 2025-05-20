import React from "react";
import { Link } from "react-router-dom";

const AboutPage = () => {
  return (
    <div className="container-custom py-20">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-6 text-[#3884b8]">About StudiesHQ</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Empowering freelancers and businesses to connect, collaborate, and succeed in the digital economy
        </p>
      </div>

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
            building your career or a business scaling your team, StudiesHQ is your trusted partner in the new world of
            work.
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
            talent, rewards quality work, and creates a fair, transparent marketplace for modern collaboration—designed
            by those who understand both sides of the freelance experience.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-10">
          <h2 className="text-2xl font-bold mb-6 text-[#0d81c8]">Our Vision</h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            To be the leading platform where professionals and businesses worldwide connect to deliver high-impact work,
            grow careers, and build lasting partnerships.
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
              icon: "🤝",
            },
            {
              title: "Flexibility",
              description: "We support working on your own terms—whether you're hiring or freelancing.",
              icon: "⚡",
            },
            {
              title: "Quality First",
              description:
                "From platform experience to talent pool, we're committed to delivering high standards at every touchpoint.",
              icon: "✨",
            },
            {
              title: "Innovation",
              description: "Our tools evolve with your needs—powered by intelligent matching and secure workflows.",
              icon: "💡",
            },
            {
              title: "Growth Mindset",
              description: "We create space for individuals and businesses to scale, learn, and succeed.",
              icon: "📈",
            },
          ].map((value, index) => (
            <div
              key={index}
              className="p-8 border border-gray-100 rounded-xl hover:shadow-lg transition-all duration-300 hover:border-[#3884b8]/20"
            >
              <div className="text-4xl mb-4">{value.icon}</div>
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
              Find the perfect talent for your projects with our advanced matching system. Work with confidence knowing
              that our platform ensures quality and reliability.
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
  );
};

export default AboutPage;
