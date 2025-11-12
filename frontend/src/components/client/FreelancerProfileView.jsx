import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import profileService from "../../services/profileService";
import InviteFreelancerModal from "./InviteFreelancerModal";

const FreelancerProfileView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await profileService.getProfileByUserId(userId);
        setProfile(response.data.profile);
      } catch (err) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const handleInviteClick = () => {
    setShowInviteModal(true);
  };

  const handleCloseModal = () => {
    setShowInviteModal(false);
  };

  const handleInviteSuccess = () => {
    console.log("Invitation sent successfully");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const calculateExperience = (experiences) => {
    if (!experiences || experiences.length === 0) return "No experience listed";
    
    const totalYears = experiences.reduce((total, exp) => {
      const start = new Date(exp.from);
      const end = exp.to ? new Date(exp.to) : new Date();
      const years = (end - start) / (1000 * 60 * 60 * 24 * 365);
      return total + years;
    }, 0);

    return totalYears >= 1 ? `${Math.round(totalYears)} years` : "Less than 1 year";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">{error}</div>
        <button
          onClick={() => navigate(-1)}
          className="btn-outline"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">Profile not found</div>
        <button
          onClick={() => navigate(-1)}
          className="btn-outline"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Freelancers
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Freelancer Profile</h1>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="flex items-center mb-6 md:mb-0">
            <div className="w-24 h-24 bg-primary-light rounded-full flex items-center justify-center text-white text-2xl font-semibold overflow-hidden">
              {profile.user.avatar ? (
                <img
                  src={profile.user.avatar}
                  alt={profile.user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                profile.user.name.charAt(0)
              )}
            </div>
            <div className="ml-6">
              <h2 className="text-2xl font-bold text-gray-900">{profile.user.name}</h2>
              <p className="text-lg text-gray-600">{profile.title || "Freelancer"}</p>
              {(profile.user.companyFreelancer?.companyName || profile.user.companyFreelancerName) && (
                <p className="text-sm text-primary font-medium mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {profile.user.companyFreelancer?.companyName || profile.user.companyFreelancerName}
                </p>
              )}
              <div className="flex items-center mt-2">
                <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-600">{profile.location || "Location not specified"}</span>
              </div>
            </div>
          </div>
          
          <div className="md:ml-auto">
            <div className="flex flex-col items-start md:items-end space-y-3">
              <div className="text-2xl font-bold text-primary">
                {typeof profile.hourlyRate === "object" && profile.hourlyRate.min !== undefined
                  ? `$${profile.hourlyRate.min} - $${profile.hourlyRate.max} USD/hr`
                  : profile.hourlyRate
                  ? `$${profile.hourlyRate} USD/hr`
                  : "Rate not specified"}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleInviteClick}
                  className="btn-primary"
                >
                  Invite to Project
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Availability & Status */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-6">
            {profile.availability && (
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500 mr-2">Availability:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profile.availability === "Full-time" ? "bg-green-100 text-green-800" :
                  profile.availability === "Part-time" ? "bg-yellow-100 text-yellow-800" :
                  profile.availability === "Not Available" ? "bg-red-100 text-red-800" :
                  "bg-blue-100 text-blue-800"
                }`}>
                  {profile.availability}
                </span>
              </div>
            )}
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500 mr-2">Experience:</span>
              <span className="text-sm text-gray-700">{calculateExperience(profile.experience)}</span>
            </div>
            {profile.isVerified && (
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-green-700 font-medium">Verified</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* About Section */}
      {profile.bio && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">About</h3>
          <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* Skills Section */}
      {profile.skills && profile.skills.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Experience Section */}
      {profile.experience && profile.experience.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Work Experience</h3>
          <div className="space-y-6">
            {profile.experience.map((exp, index) => (
              <div key={index} className="border-l-4 border-primary pl-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{exp.title}</h4>
                    <p className="text-blue-600 font-medium">{exp.company}</p>
                    <p className="text-gray-600">{exp.location}</p>
                  </div>
                  <div className="text-sm text-gray-500 mt-1 md:mt-0">
                    {formatDate(exp.from)} - {exp.to ? formatDate(exp.to) : "Present"}
                  </div>
                </div>
                {exp.description && (
                  <p className="text-gray-700 mt-2">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education Section */}
      {profile.education && profile.education.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Education</h3>
          <div className="space-y-4">
            {profile.education.map((edu, index) => (
              <div key={index} className="border-l-4 border-green-500 pl-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{edu.degree}</h4>
                    <p className="text-green-600 font-medium">{edu.school}</p>
                    <p className="text-gray-600">{edu.fieldOfStudy}</p>
                  </div>
                  <div className="text-sm text-gray-500 mt-1 md:mt-0">
                    {formatDate(edu.from)} - {edu.to ? formatDate(edu.to) : "Present"}
                  </div>
                </div>
                {edu.description && (
                  <p className="text-gray-700 mt-2">{edu.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio Section */}
      {profile.portfolioItems && profile.portfolioItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Portfolio</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile.portfolioItems.map((item, index) => (
              <div key={index} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                  {item.description && (
                    <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                  )}
                  {item.projectUrl && (
                    <a
                      href={item.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm font-medium"
                    >
                      View Project →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Languages Section */}
      {profile.languages && profile.languages.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Languages</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.languages.map((lang, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">{lang.language}</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  lang.proficiency === "Native" ? "bg-green-100 text-green-800" :
                  lang.proficiency === "Fluent" ? "bg-blue-100 text-blue-800" :
                  lang.proficiency === "Conversational" ? "bg-yellow-100 text-yellow-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {lang.proficiency}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social Links & Verification */}
      {(profile.linkedinVerification?.isVerified || profile.social?.linkedin || profile.githubAnalysis || profile.social?.github || (profile.testScore && profile.testScore.score !== null && profile.testScore.score !== undefined)) && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Social Links & Verification</h3>
          
          <div className="space-y-6">
            {/* GitHub Card - Horizontal */}
            {profile.githubAnalysis || profile.social?.github ? (
              <div className="border border-gray-300 rounded-xl p-5 bg-gradient-to-br from-gray-50 via-slate-50 to-gray-50 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-14 h-14 bg-gray-900 rounded-xl flex items-center justify-center shadow-md">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">GitHub</h4>
                      {profile.githubAnalysis?.profileInfo?.username && (
                        <p className="text-sm text-gray-600 mt-0.5">@{profile.githubAnalysis.profileInfo.username}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {profile.githubAnalysis?.profileInfo ? (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Public Repos</p>
                        <p className="text-3xl font-bold text-gray-900">{profile.githubAnalysis.profileInfo.publicRepos || 0}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Followers</p>
                        <p className="text-3xl font-bold text-gray-900">{profile.githubAnalysis.profileInfo.followers || 0}</p>
                      </div>
                      {profile.githubAnalysis.repositoriesSummary?.primaryLanguage && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Primary Language</p>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                            <p className="text-lg font-bold text-gray-900">{profile.githubAnalysis.repositoriesSummary.primaryLanguage}</p>
                          </div>
                        </div>
                      )}
                      {profile.social?.github && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm flex items-center justify-center">
                          <a
                            href={profile.social.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-gray-700 hover:text-gray-900 font-medium text-sm"
                          >
                            View Profile
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>
                    
                    {/* Top Languages */}
                    {profile.githubAnalysis.repositoriesSummary?.languageOverview && 
                     profile.githubAnalysis.repositoriesSummary.languageOverview.length > 0 && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center mb-4">
                          <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Top Languages</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                          {profile.githubAnalysis.repositoriesSummary.languageOverview
                            .slice(0, 5)
                            .map((lang, index) => (
                              <div key={index} className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-gray-900">{lang.language}</span>
                                  <span className="text-xs font-bold text-gray-600">
                                    {lang.percentage ? lang.percentage.toFixed(1) : 0}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600 rounded-full transition-all duration-500 shadow-sm"
                                    style={{ width: `${lang.percentage || 0}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : profile.social?.github ? (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <a
                      href={profile.social.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full text-gray-700 hover:text-gray-900 font-medium text-sm bg-white border-2 border-gray-300 rounded-lg py-2.5 px-4 hover:bg-gray-50 transition-all shadow-sm hover:shadow"
                    >
                      View GitHub Profile
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* LinkedIn and Skills Assessment Test - Vertical Cards Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LinkedIn Card */}
              {(profile.linkedinVerification?.isVerified || profile.social?.linkedin) && (
                <div className="border border-blue-200 rounded-xl p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">LinkedIn</h4>
                      {profile.linkedinVerification?.isVerified && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 mt-1.5 border border-green-200">
                          <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {profile.linkedinVerification?.isVerified && profile.linkedinVerification?.profileData ? (
                  <div className="border-t border-blue-200 pt-4 mt-4">
                    <div className="flex items-center space-x-3 mb-4 bg-white rounded-lg p-3 border border-blue-100">
                      {profile.linkedinVerification.profileData.picture && (
                        <img
                          src={profile.linkedinVerification.profileData.picture}
                          alt={profile.linkedinVerification.profileData.name}
                          className="w-14 h-14 rounded-full border-2 border-blue-300 shadow-sm"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{profile.linkedinVerification.profileData.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Verified on {new Date(profile.linkedinVerification.verifiedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {profile.social?.linkedin && (
                      <a
                        href={profile.social.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-full text-blue-700 hover:text-blue-900 font-medium text-sm bg-white border-2 border-blue-300 rounded-lg py-2.5 px-4 hover:bg-blue-50 transition-all shadow-sm hover:shadow"
                      >
                        View LinkedIn Profile
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                ) : profile.social?.linkedin ? (
                  <a
                    href={profile.social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full text-blue-700 hover:text-blue-900 font-medium text-sm bg-white border-2 border-blue-300 rounded-lg py-2.5 px-4 hover:bg-blue-50 transition-all shadow-sm hover:shadow mt-2"
                  >
                    View LinkedIn Profile
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : null}
                </div>
              )}

            {/* Skills Assessment Test Results */}
            {profile.testScore && profile.testScore.score !== null && profile.testScore.score !== undefined ? (
              <div className="border border-blue-200 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-md mr-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Skills Assessment Test</h4>
                </div>
                
                <div className="space-y-4">
                  {/* Overall Score Section */}
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Overall Score</p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold text-blue-600">{profile.testScore.score}</span>
                        <span className="text-lg text-gray-400">/</span>
                        <span className="text-2xl font-bold text-gray-600">{profile.testScore.maxScore}</span>
                      </div>
                      <div className="inline-flex items-center justify-center px-3 py-1 bg-blue-600 rounded-full">
                        <span className="text-sm font-bold text-white">
                          {profile.testScore.maxScore > 0
                            ? `${Math.round((profile.testScore.score / profile.testScore.maxScore) * 100)}%`
                            : "0%"}
                        </span>
                      </div>
                    </div>
                    {/* Star Rating */}
                    <div className="flex items-center gap-1">
                      {(() => {
                        const percentage = profile.testScore.maxScore > 0
                          ? (profile.testScore.score / profile.testScore.maxScore) * 100
                          : 0;
                        const filledStars = Math.round((percentage / 100) * 5);
                        return Array.from({ length: 5 }).map((_, index) => {
                          const isFilled = index < filledStars;
                          return (
                            <svg
                              key={index}
                              className={`w-4 h-4 ${isFilled ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  {profile.testScore.breakdown && (
                    <div className="grid grid-cols-2 gap-2">
                      {profile.testScore.breakdown.mcq !== null && profile.testScore.breakdown.mcq !== undefined && (
                        <div className="bg-white rounded-lg p-3 border border-blue-200">
                          <p className="text-xs font-medium text-gray-600 mb-1">MCQ</p>
                          <p className="text-xl font-bold text-gray-900">{profile.testScore.breakdown.mcq}</p>
                        </div>
                      )}
                      {profile.testScore.breakdown.theory !== null && profile.testScore.breakdown.theory !== undefined && (
                        <div className="bg-white rounded-lg p-3 border border-indigo-200">
                          <p className="text-xs font-medium text-gray-600 mb-1">Theory</p>
                          <p className="text-xl font-bold text-gray-900">{profile.testScore.breakdown.theory}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Test Completion Date */}
                  {profile.testScore.evaluatedAt && (
                    <p className="text-xs text-gray-500 text-center pt-3 border-t border-blue-200">
                      Completed on {new Date(profile.testScore.evaluatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            ) : null}
            </div>
          </div>
        </div>
      )}


      {/* Invite Modal */}
      <InviteFreelancerModal
        isOpen={showInviteModal}
        onClose={handleCloseModal}
        freelancer={profile}
        onInviteSuccess={handleInviteSuccess}
      />
    </div>
  );
};

export default FreelancerProfileView;
