import { useState } from "react";
import { Link } from "react-router-dom";

// Components for each section
import HeroSection from "../components/home/HeroSection";
import HowItWorksSection from "../components/home/HowItWorksSection";
import KeyFeaturesSection from "../components/home/KeyFeaturesSection";
import FindWorkSection from "../components/home/FindWorkSection";
import ClientValueSection from "../components/home/ClientValueSection";
import DifferenceSection from "../components/home/DifferenceSection";
import TestimonialsSection from "../components/home/TestimonialsSection";

const HomePage = () => {
  return (
    <div>
      {" "}
      {/* Add padding top to account for fixed navbar */}
      {/* Hero Section */}
      <HeroSection />
      {/* How It Works Section */}
      <HowItWorksSection />
      {/* Key Features Section */}
      <KeyFeaturesSection />
      {/* Find Work Section */}
      <FindWorkSection />
      {/* Client Value Section */}
      <ClientValueSection />
      {/* StudiesHQ Difference Section */}
      <DifferenceSection />
      {/* Testimonials Section */}
      <TestimonialsSection />
    </div>
  );
};

export default HomePage;
