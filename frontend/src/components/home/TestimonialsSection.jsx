import React, { useState, useEffect } from "react";

const TestimonialsSection = () => {
  const testimonials = [
    {
      id: 1,
      name: "Alex Johnson",
      role: "UI/UX Designer",
      company: "Freelancer",
      image: "/images/testimonials/alex.jpg",
      content:
        "StudiesHQ transformed my freelance career. The quality of clients and projects I've found here has allowed me to increase my rates by 35% while working fewer hours.",
      rating: 5,
      location: "Toronto, Canada",
    },
    {
      id: 2,
      name: "Maria Rodriguez",
      role: "Marketing Director",
      company: "GrowthMatters Inc.",
      image: "/images/testimonials/maria.jpg",
      content:
        "We've hired over 20 freelancers through StudiesHQ for various projects. The talent quality is consistently excellent, and the platform makes management simple.",
      rating: 5,
      location: "New York, USA",
    },
    {
      id: 3,
      name: "David Chen",
      role: "Full Stack Developer",
      company: "Freelancer",
      image: "/images/testimonials/david.jpg",
      content:
        "The payment protection and milestone system gives me peace of mind. I can focus on coding instead of chasing payments or dealing with contract issues.",
      rating: 5,
      location: "Singapore",
    },
    {
      id: 4,
      name: "Sarah Williams",
      role: "Content Strategist",
      company: "Freelancer",
      image: "/images/testimonials/sarah.jpg",
      content:
        "I've tried several freelance platforms, but StudiesHQ offers the most direct client relationships with the lowest fees. My income has increased 40% since switching.",
      rating: 5,
      location: "London, UK",
    },
    {
      id: 5,
      name: "James Taylor",
      role: "CEO",
      company: "InnovateX",
      image: "/images/testimonials/james.jpg",
      content:
        "As a startup founder, StudiesHQ has been invaluable for accessing specialized talent we couldn't afford to hire full-time. The quality-to-cost ratio is unmatched.",
      rating: 5,
      location: "Berlin, Germany",
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handleDotClick = (index) => {
    setActiveIndex(index);
  };

  const handlePrev = () => {
    setActiveIndex((prevIndex) => (prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1));
  };

  const handleNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#3884b8]">What Our Community Says</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Real stories from freelancers and clients who have found success on StudiesHQ
          </p>
        </div>

        {/* Testimonial Carousel */}
        <div className="relative max-w-5xl mx-auto px-4">
          <div className="relative overflow-hidden pb-12">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                  <div className="bg-white rounded-xl shadow-lg p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center">
                    <div className="md:w-1/3 flex flex-col items-center text-center">
                      <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-[#3884b8]/20">
                        {/* <img
                          src={testimonial.image || "https://via.placeholder.com/96"}
                          alt={testimonial.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/96";
                          }}
                        /> */}
                      </div>
                      <h4 className="font-bold text-lg text-[#0d81c8]">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                      <p className="text-sm font-medium text-[#3884b8]">{testimonial.company}</p>
                      <p className="text-xs text-gray-500 mt-1">{testimonial.location}</p>

                      <div className="flex items-center mt-3">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-5 h-5 ${i < testimonial.rating ? "text-yellow-400" : "text-gray-300"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>

                    <div className="md:w-2/3">
                      <div className="relative">
                        <svg
                          className="absolute -top-4 -left-2 w-10 h-10 text-[#3884b8]/20 transform rotate-180"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <p className="text-lg leading-relaxed mb-6 pl-8">"{testimonial.content}"</p>

                        <div className="mt-auto pt-6 border-t border-gray-100">
                          <p className="text-sm text-gray-500 italic">
                            Project completed {Math.floor(Math.random() * 11) + 1} months ago
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={handlePrev}
            className="absolute top-1/2 -translate-y-1/2 left-0 bg-white rounded-full shadow-lg p-2 hover:bg-gray-50 transition-colors z-10"
            aria-label="Previous testimonial"
          >
            <svg
              className="w-6 h-6 text-[#3884b8]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleNext}
            className="absolute top-1/2 -translate-y-1/2 right-0 bg-white rounded-full shadow-lg p-2 hover:bg-gray-50 transition-colors z-10"
            aria-label="Next testimonial"
          >
            <svg
              className="w-6 h-6 text-[#3884b8]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots */}
          <div className="flex justify-center mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`w-3 h-3 mx-1 rounded-full transition-colors ${
                  index === activeIndex ? "bg-[#3884b8]" : "bg-gray-300"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 bg-white rounded-xl shadow-lg p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <p className="text-4xl font-bold text-[#3884b8] mb-2">93%</p>
              <p className="text-sm text-gray-600">Satisfaction Rate</p>
            </div>
            <div className="p-4">
              <p className="text-4xl font-bold text-[#3884b8] mb-2">15k+</p>
              <p className="text-sm text-gray-600">Completed Projects</p>
            </div>
            <div className="p-4">
              <p className="text-4xl font-bold text-[#3884b8] mb-2">24/7</p>
              <p className="text-sm text-gray-600">Customer Support</p>
            </div>
            <div className="p-4">
              <p className="text-4xl font-bold text-[#3884b8] mb-2">4.8/5</p>
              <p className="text-sm text-gray-600">Average Rating</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-6 text-[#3884b8]">Ready to start your journey?</h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="px-8 py-3 bg-[#3884b8] text-white rounded-lg hover:bg-[#0d81c8] transition-colors text-lg"
            >
              Create Free Account
            </a>
            <a
              href="/search"
              className="px-8 py-3 border-2 border-[#3884b8] text-[#3884b8] rounded-lg hover:bg-[#3884b8] hover:text-white transition-colors text-lg"
            >
              Browse Opportunities
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
