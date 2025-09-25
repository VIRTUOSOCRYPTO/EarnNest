import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatCurrency } from '../App';
import { 
  BriefcaseIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  StarIcon,
  ArrowTopRightOnSquareIcon,
  AcademicCapIcon,
  ComputerDesktopIcon,
  PaintBrushIcon,
  TruckIcon,
  BoltIcon,
  PlusIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Hustles = () => {
  const [aiHustles, setAiHustles] = useState([]);
  const [userHustles, setUserHustles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('browse'); // 'browse', 'my-hustles', 'my-applications'
  const [adminHustles, setAdminHustles] = useState([]);
  const [myPostedHustles, setMyPostedHustles] = useState([]);
  const [trendingSkills, setTrendingSkills] = useState([]);
  const [editingHustle, setEditingHustle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedHustle, setSelectedHustle] = useState(null);
  const [myApplications, setMyApplications] = useState([]);

  const [createFormData, setCreateFormData] = useState({
    title: '',
    description: '',
    category: 'tutoring',
    pay_rate: '',
    pay_type: 'hourly',
    time_commitment: '',
    required_skills: '', // Changed to string for comma-separated input
    difficulty_level: 'beginner',
    location: '', // Changed to string for simple location input
    is_remote: true,
    contact_info: '', // Changed to string for simple contact input
    max_applicants: ''
  });

  const [applicationData, setApplicationData] = useState({
    cover_message: ''
  });

  const categoryIcons = {
    tutoring: AcademicCapIcon,
    freelance: ComputerDesktopIcon,
    content_creation: PaintBrushIcon,
    delivery: TruckIcon,
    micro_tasks: BoltIcon
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const requests = [
        axios.get(`${API}/hustles/categories`),
        axios.get(`${API}/auth/trending-skills`)
      ];

      if (activeTab === 'browse') {
        requests.push(
          axios.get(`${API}/hustles/recommendations`),
          axios.get(`${API}/hustles/user-posted`),
          axios.get(`${API}/hustles/admin-posted`)
        );
      } else if (activeTab === 'my-applications') {
        requests.push(axios.get(`${API}/hustles/my-applications`));
      } else if (activeTab === 'my-hustles') {
        requests.push(axios.get(`${API}/hustles/my-posted`));
      }

      const responses = await Promise.all(requests);
      setCategories(responses[0].data);
      setTrendingSkills(responses[1].data.trending_skills);

      if (activeTab === 'browse') {
        setAiHustles(responses[2].data);
        setUserHustles(responses[3].data);
        setAdminHustles(responses[4].data);
      } else if (activeTab === 'my-applications') {
        setMyApplications(responses[2].data);
      } else if (activeTab === 'my-hustles') {
        setMyPostedHustles(responses[2].data);
      }
    } catch (error) {
      console.error('Error fetching hustles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHustle = async (e) => {
    e.preventDefault();
    try {
      // Parse required_skills from comma-separated string to array
      const skillsArray = createFormData.required_skills
        ? createFormData.required_skills.split(',').map(skill => skill.trim()).filter(skill => skill)
        : [];

      // Structure contact info as object
      const contactInfo = {};
      if (createFormData.contact_info) {
        // Simple parsing - could be email, phone, or website
        const contactValue = createFormData.contact_info.trim();
        if (contactValue.includes('@')) {
          contactInfo.email = contactValue;
        } else if (contactValue.startsWith('http')) {
          contactInfo.website = contactValue;
        } else {
          contactInfo.phone = contactValue;
        }
      }

      const submitData = {
        title: createFormData.title,
        description: createFormData.description,
        category: createFormData.category,
        pay_rate: parseFloat(createFormData.pay_rate),
        pay_type: createFormData.pay_type,
        time_commitment: createFormData.time_commitment,
        required_skills: skillsArray,
        difficulty_level: createFormData.difficulty_level,
        location: createFormData.location && createFormData.location.trim() ? {
          area: createFormData.location,
          city: createFormData.location,
          state: createFormData.location
        } : null,
        is_remote: createFormData.is_remote,
        contact_info: contactInfo,
        max_applicants: createFormData.max_applicants ? parseInt(createFormData.max_applicants) : null
      };

      console.log('Submitting hustle data:', submitData);
      console.log('Current axios headers:', axios.defaults.headers.common);

      const response = await axios.post(`${API}/hustles/create`, submitData);
      console.log('Hustle creation response:', response.data);
      
      setShowCreateForm(false);
      resetCreateForm();
      
      // Refresh data if on my-hustles tab
      if (activeTab === 'my-hustles') {
        fetchData();
      }
      
      alert('Side hustle posted successfully!');
    } catch (error) {
      console.error('Error creating hustle:', error);
      console.error('Error response:', error.response);
      
      let errorMessage = 'Failed to create hustle. Please check all required fields.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (error.response?.status === 422) {
        errorMessage = `Validation error: ${error.response.data?.detail || 'Invalid data provided'}`;
      } else if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map(e => e.msg).join(', ');
        } else {
          errorMessage = error.response.data.detail;
        }
      }
      
      alert(errorMessage);
    }
  };

  const resetCreateForm = () => {
    setCreateFormData({
      title: '',
      description: '',
      category: 'tutoring',
      pay_rate: '',
      pay_type: 'hourly',
      time_commitment: '',
      required_skills: '', // Changed to string
      difficulty_level: 'beginner',
      location: '', // Changed to string
      is_remote: true,
      contact_info: '', // Changed to string
      max_applicants: ''
    });
  };

  const handleUpdateHustle = async (hustleId, updateData) => {
    try {
      await axios.put(`${API}/hustles/${hustleId}`, updateData);
      setEditingHustle(null);
      fetchData(); // Refresh the data
    } catch (error) {
      console.error('Error updating hustle:', error);
      alert('Failed to update hustle. Please try again.');
    }
  };

  const handleDeleteHustle = async (hustleId) => {
    if (!window.confirm('Are you sure you want to delete this hustle?')) return;
    
    try {
      console.log('Deleting hustle:', hustleId);
      console.log('Current axios headers:', axios.defaults.headers.common);
      
      const response = await axios.delete(`${API}/hustles/${hustleId}`);
      console.log('Delete response:', response.data);
      
      fetchData(); // Refresh the data
      alert('Hustle deleted successfully!');
    } catch (error) {
      console.error('Error deleting hustle:', error);
      console.error('Delete error response:', error.response);
      
      let errorMessage = 'Failed to delete hustle. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Hustle not found or already deleted.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      alert(errorMessage);
    }
  };

  const addSkill = (skill) => {
    if (!createFormData.required_skills.includes(skill)) {
      setCreateFormData({
        ...createFormData,
        required_skills: [...createFormData.required_skills, skill]
      });
    }
  };

  const removeSkill = (skillToRemove) => {
    setCreateFormData({
      ...createFormData,
      required_skills: createFormData.required_skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleApplyToHustle = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/hustles/${selectedHustle.id}/apply`, applicationData);
      setShowApplicationForm(false);
      setApplicationData({ cover_message: '' });
      setSelectedHustle(null);
      
      // Refresh data if on applications tab
      if (activeTab === 'my-applications') {
        fetchData();
      }
    } catch (error) {
      console.error('Error applying to hustle:', error);
    }
  };

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getContactType = (contactInfo) => {
    if (!contactInfo) return 'unknown';
    
    // Handle object format from backend (e.g., {email: "...", phone: "...", website: "..."})
    if (typeof contactInfo === 'object' && contactInfo !== null) {
      if (contactInfo.email) return 'email';
      if (contactInfo.phone) return 'phone';
      if (contactInfo.website) return 'website';
      return 'unknown';
    }
    
    // Handle string format
    const contactString = String(contactInfo);
    
    // Email pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(contactString)) {
      return 'email';
    }
    
    // Phone pattern (international and Indian)
    const phoneRegex = /^[\+]?[1-9][\d]{3,14}$/;
    if (phoneRegex.test(contactString.replace(/[\s\-\(\)]/g, ''))) {
      return 'phone';
    }
    
    // URL pattern
    const urlRegex = /^https?:\/\/[^\s]+$/;
    if (urlRegex.test(contactString)) {
      return 'website';
    }
    
    return 'unknown';
  };

  const handleContactClick = (contactInfo, contactType = null) => {
    if (!contactInfo) return;
    
    const type = contactType || getContactType(contactInfo);
    let contactValue = contactInfo;
    
    // Extract actual contact value from object format
    if (typeof contactInfo === 'object' && contactInfo !== null) {
      if (type === 'email' && contactInfo.email) {
        contactValue = contactInfo.email;
      } else if (type === 'phone' && contactInfo.phone) {
        contactValue = contactInfo.phone;
      } else if (type === 'website' && contactInfo.website) {
        contactValue = contactInfo.website;
      } else {
        // Fallback to first available contact method
        contactValue = contactInfo.email || contactInfo.phone || contactInfo.website || String(contactInfo);
      }
    }
    
    switch (type) {
      case 'email':
        window.location.href = `mailto:${contactValue}`;
        break;
      case 'phone':
        window.location.href = `tel:${contactValue}`;
        break;
      case 'website':
        window.open(contactValue, '_blank', 'noopener,noreferrer');
        break;
      default:
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(String(contactValue));
        alert('Contact information copied to clipboard!');
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const allHustles = [...aiHustles, ...userHustles];
  const allHustlesWithAdmin = [...aiHustles, ...userHustles, ...adminHustles];
  const filteredHustles = selectedCategory === 'all' 
    ? allHustles 
    : allHustles.filter(hustle => hustle.category === selectedCategory);
  const filteredAdminHustles = selectedCategory === 'all'
    ? adminHustles
    : adminHustles.filter(hustle => hustle.category === selectedCategory);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 fade-in">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Side Hustle Hub</h1>
        <p className="text-gray-600">Discover opportunities, create your own, and track applications</p>
      </div>

      {/* Tabs */}
      <div className="mb-8 slide-up">
        <div className="flex flex-wrap gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
              activeTab === 'browse'
                ? 'bg-emerald-100 text-emerald-700 border-b-2 border-emerald-500'
                : 'text-gray-600 hover:text-emerald-600'
            }`}
          >
            Browse Opportunities
          </button>
          <button
            onClick={() => setActiveTab('my-hustles')}
            className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
              activeTab === 'my-hustles'
                ? 'bg-emerald-100 text-emerald-700 border-b-2 border-emerald-500'
                : 'text-gray-600 hover:text-emerald-600'
            }`}
          >
            My Posted Hustles
          </button>
          <button
            onClick={() => setActiveTab('my-applications')}
            className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
              activeTab === 'my-applications'
                ? 'bg-emerald-100 text-emerald-700 border-b-2 border-emerald-500'
                : 'text-gray-600 hover:text-emerald-600'
            }`}
          >
            My Applications
          </button>
        </div>
      </div>

      {/* Browse Tab Content */}
      {activeTab === 'browse' && (
        <>
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 slide-up">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200'
                    : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-300'
                }`}
              >
                All Categories
              </button>
              
              {categories.map((category) => {
                const Icon = categoryIcons[category.name] || BriefcaseIcon;
                return (
                  <button
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedCategory === category.name
                        ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200'
                        : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {category.display}
                  </button>
                );
              })}
            </div>

            {/* Create Button */}
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
            >
              <PlusIcon className="w-5 h-5" />
              Post a Side Hustle
            </button>
          </div>

          {/* Admin-Shared Hustles Section */}
          {filteredAdminHustles.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <StarIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Featured Opportunities</h2>
                  <p className="text-gray-600">Curated by EarnNest team</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredAdminHustles.map((hustle, index) => {
                  const CategoryIcon = categoryIcons[hustle.category] || BriefcaseIcon;
                  
                  return (
                    <div
                      key={hustle.id}
                      className="hustle-card slide-up border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="hustle-category bg-purple-100 text-purple-700">
                          <CategoryIcon className="w-4 h-4" />
                          {categories.find(c => c.name === hustle.category)?.display || hustle.category}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <StarIcon className="w-4 h-4 text-purple-500 fill-current" />
                          <span className="text-xs font-semibold text-purple-600">Featured</span>
                        </div>
                      </div>

                      {/* Title and Description */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{hustle.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{hustle.description}</p>

                      {/* Pay and Time */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1">
                          <CurrencyDollarIcon className="w-4 h-4 text-emerald-500" />
                          <span className="hustle-pay">
                            {formatCurrency(hustle.estimated_pay || hustle.pay_rate)}
                          </span>
                          <span className="text-sm text-gray-500">
                            /{hustle.pay_type || 'estimated'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-gray-500">
                          <ClockIcon className="w-4 h-4" />
                          <span className="text-sm">{hustle.time_commitment}</span>
                        </div>
                      </div>

                      {/* Skills and Details */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1 mb-2">
                          {(hustle.required_skills || []).slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Section */}
                      <div className="flex items-center justify-between pt-4 border-t border-purple-100">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(hustle.difficulty_level)}`}>
                          {hustle.difficulty_level}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-medium">
                            {hustle.platform}
                          </span>
                        </div>
                      </div>

                      {/* Apply Button */}
                      {hustle.application_link ? (
                        <button
                          onClick={() => handleContactClick(hustle.application_link)}
                          className="btn-primary w-full mt-4 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700"
                        >
                          Apply via {getContactType(hustle.application_link) === 'email' ? 'Email' : 
                                    getContactType(hustle.application_link) === 'phone' ? 'Phone' : 
                                    getContactType(hustle.application_link) === 'website' ? hustle.platform : 'Contact'}
                          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleContactClick(hustle.contact_info)}
                          className="btn-primary w-full mt-4 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700"
                        >
                          Contact Now
                          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Regular Hustles Section */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">All Opportunities</h2>
            <p className="text-gray-600">AI-recommended and community-shared hustles</p>
          </div>

          {/* Hustles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHustles.length > 0 ? (
              filteredHustles.map((hustle, index) => {
                const CategoryIcon = categoryIcons[hustle.category] || BriefcaseIcon;
                
                return (
                  <div
                    key={hustle.id}
                    className="hustle-card slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="hustle-category">
                        <CategoryIcon className="w-4 h-4" />
                        {categories.find(c => c.name === hustle.category)?.display || hustle.category}
                      </div>
                      
                      {hustle.ai_recommended && (
                        <div className="flex items-center gap-1">
                          <StarIcon className="w-4 h-4 text-purple-500" />
                          <span className="text-xs font-semibold text-purple-600">AI Match</span>
                        </div>
                      )}
                    </div>

                    {/* Title and Description */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{hustle.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{hustle.description}</p>

                    {/* Pay and Time */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1">
                        <CurrencyDollarIcon className="w-4 h-4 text-emerald-500" />
                        <span className="hustle-pay">
                          {formatCurrency(hustle.estimated_pay || hustle.pay_rate)}
                        </span>
                        <span className="text-sm text-gray-500">
                          /{hustle.pay_type || 'hour'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-gray-500">
                        <ClockIcon className="w-4 h-4" />
                        <span className="text-sm">{hustle.time_commitment}</span>
                      </div>
                    </div>

                    {/* Skills and Details */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(hustle.required_skills || []).slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                      
                      {hustle.location && (
                        <div className="flex items-center gap-1 text-gray-500 mb-1">
                          <MapPinIcon className="w-3 h-3" />
                          <span className="text-xs">
                            {typeof hustle.location === 'object' && hustle.location !== null
                              ? hustle.location.city || hustle.location.area || JSON.stringify(hustle.location)
                              : hustle.location}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Section */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(hustle.difficulty_level)}`}>
                          {hustle.difficulty_level}
                        </span>
                        
                        {hustle.match_score > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Match:</span>
                            <span className={`text-xs font-semibold ${getMatchScoreColor(hustle.match_score)}`}>
                              {Math.round(hustle.match_score)}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Creator Info for User Posts */}
                      {hustle.created_by && (
                        <div className="flex items-center gap-1">
                          {hustle.creator_photo ? (
                            <img 
                              src={`${BACKEND_URL}${hustle.creator_photo}`}
                              alt={hustle.creator_name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <UserIcon className="w-6 h-6 text-gray-400" />
                          )}
                          <span className="text-xs text-gray-500">{hustle.creator_name}</span>
                        </div>
                      )}
                    </div>

                    {/* Apply Button */}
                    {hustle.application_link ? (
                      <button
                        onClick={() => handleContactClick(hustle.application_link)}
                        className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                      >
                        Apply via {getContactType(hustle.application_link) === 'email' ? 'Email' : 
                                  getContactType(hustle.application_link) === 'phone' ? 'Phone' : 
                                  getContactType(hustle.application_link) === 'website' ? hustle.platform : 'Contact'}
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                      </button>
                    ) : hustle.contact_info ? (
                      <button
                        onClick={() => handleContactClick(hustle.contact_info)}
                        className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                      >
                        Contact {getContactType(hustle.contact_info) === 'email' ? 'via Email' : 
                               getContactType(hustle.contact_info) === 'phone' ? 'via Phone' : 
                               getContactType(hustle.contact_info) === 'website' ? 'via Website' : 'Now'}
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setSelectedHustle(hustle);
                          setShowApplicationForm(true);
                        }}
                        className="btn-primary w-full mt-4"
                      >
                        Apply Now
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12 slide-up">
                <BriefcaseIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-500 mb-2">No hustles found</h3>
                <p className="text-gray-400 mb-6">
                  {selectedCategory === 'all' 
                    ? 'Update your skills in your profile to get better recommendations'
                    : 'Try selecting a different category'
                  }
                </p>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="btn-primary"
                >
                  View All Categories
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* My Applications Tab Content */}
      {activeTab === 'my-applications' && (
        <div className="space-y-4">
          {myApplications.length > 0 ? (
            myApplications.map((application, index) => (
              <div key={application.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{application.hustle_title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                        {application.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <BriefcaseIcon className="w-4 h-4" />
                        {application.hustle_category}
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        Applied {new Date(application.applied_at).toLocaleDateString('en-IN')}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Your Message:</p>
                      <p className="text-sm text-gray-600">{application.cover_message}</p>
                    </div>
                  </div>
                  
                  {application.status === 'accepted' && (
                    <div className="ml-4">
                      <CheckCircleIcon className="w-8 h-8 text-green-500" />
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <BriefcaseIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-500 mb-2">No applications yet</h3>
              <p className="text-gray-400 mb-6">Start applying to side hustles to see them here</p>
              <button
                onClick={() => setActiveTab('browse')}
                className="btn-primary"
              >
                Browse Opportunities
              </button>
            </div>
          )}
        </div>
      )}

      {/* My Posted Hustles Tab Content */}
      {activeTab === 'my-hustles' && (
        <div className="space-y-4">
          {myPostedHustles.length > 0 ? (
            myPostedHustles.map((hustle, index) => (
              <div key={hustle.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{hustle.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(hustle.difficulty_level)}`}>
                        {hustle.difficulty_level}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        hustle.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {hustle.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <BriefcaseIcon className="w-4 h-4" />
                        {categories.find(c => c.name === hustle.category)?.display || hustle.category}
                      </div>
                      <div className="flex items-center gap-1">
                        <CurrencyDollarIcon className="w-4 h-4 text-emerald-500" />
                        <span>{formatCurrency(hustle.pay_rate)}/{hustle.pay_type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        {hustle.time_commitment}
                      </div>
                      <div className="flex items-center gap-1">
                        <UserIcon className="w-4 h-4" />
                        {hustle.applicants?.length || 0} applicants
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{hustle.description}</p>

                    <div className="flex flex-wrap gap-1">
                      {(hustle.required_skills || []).slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleUpdateHustle(hustle.id, {status: hustle.status === 'active' ? 'closed' : 'active'})}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        hustle.status === 'active' 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {hustle.status === 'active' ? 'Close' : 'Activate'}
                    </button>
                    <button
                      onClick={() => setEditingHustle(hustle)}
                      className="p-2 text-gray-400 hover:text-blue-600"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteHustle(hustle.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <BriefcaseIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-500 mb-2">No hustles posted yet</h3>
              <p className="text-gray-400 mb-6">Start by posting your first side hustle to attract opportunities</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary flex items-center gap-2 mx-auto"
              >
                <PlusIcon className="w-5 h-5" />
                Post Your First Hustle
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Hustle Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto slide-up">
            <h2 className="text-2xl font-bold mb-6">Post a Side Hustle</h2>
            
            <form onSubmit={handleCreateHustle} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={createFormData.title}
                    onChange={(e) => setCreateFormData({...createFormData, title: e.target.value})}
                    className="input-modern"
                    placeholder="e.g., Math Tutor for High School Students"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={createFormData.category}
                    onChange={(e) => setCreateFormData({...createFormData, category: e.target.value})}
                    className="input-modern"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.name} value={cat.name}>{cat.display}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Difficulty Level *
                  </label>
                  <select
                    value={createFormData.difficulty_level}
                    onChange={(e) => setCreateFormData({...createFormData, difficulty_level: e.target.value})}
                    className="input-modern"
                    required
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pay Rate (₹) *
                  </label>
                  <input
                    type="number"
                    value={createFormData.pay_rate}
                    onChange={(e) => setCreateFormData({...createFormData, pay_rate: e.target.value})}
                    className="input-modern"
                    placeholder="300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pay Type *
                  </label>
                  <select
                    value={createFormData.pay_type}
                    onChange={(e) => setCreateFormData({...createFormData, pay_type: e.target.value})}
                    className="input-modern"
                    required
                  >
                    <option value="hourly">Per Hour</option>
                    <option value="fixed">Fixed Price</option>
                    <option value="per_task">Per Task</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Time Commitment *
                  </label>
                  <input
                    type="text"
                    value={createFormData.time_commitment}
                    onChange={(e) => setCreateFormData({...createFormData, time_commitment: e.target.value})}
                    className="input-modern"
                    placeholder="10-15 hours/week"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={createFormData.location}
                    onChange={(e) => setCreateFormData({...createFormData, location: e.target.value})}
                    className="input-modern"
                    placeholder="Mumbai, Maharashtra"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Max Applicants
                  </label>
                  <input
                    type="number"
                    value={createFormData.max_applicants}
                    onChange={(e) => setCreateFormData({...createFormData, max_applicants: e.target.value})}
                    className="input-modern"
                    placeholder="5"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Required Skills (comma-separated) *
                  </label>
                  <input
                    type="text"
                    value={createFormData.required_skills}
                    onChange={(e) => setCreateFormData({...createFormData, required_skills: e.target.value})}
                    className="input-modern"
                    placeholder="Math, Teaching, Patience"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Information *
                  </label>
                  <input
                    type="text"
                    value={createFormData.contact_info}
                    onChange={(e) => setCreateFormData({...createFormData, contact_info: e.target.value})}
                    className="input-modern"
                    placeholder="email@example.com or phone number"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={createFormData.description}
                    onChange={(e) => setCreateFormData({...createFormData, description: e.target.value})}
                    className="input-modern resize-none"
                    rows="4"
                    placeholder="Detailed description of the work, requirements, and expectations..."
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={createFormData.is_remote}
                      onChange={(e) => setCreateFormData({...createFormData, is_remote: e.target.checked})}
                      className="w-4 h-4 text-emerald-600 rounded mr-2"
                    />
                    <label className="text-sm text-gray-700">
                      This is a remote opportunity
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Post Side Hustle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application Modal */}
      {showApplicationForm && selectedHustle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md slide-up">
            <h2 className="text-2xl font-bold mb-4">Apply to {selectedHustle.title}</h2>
            
            <form onSubmit={handleApplyToHustle} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cover Message *
                </label>
                <textarea
                  value={applicationData.cover_message}
                  onChange={(e) => setApplicationData({...applicationData, cover_message: e.target.value})}
                  className="input-modern resize-none"
                  rows="6"
                  placeholder="Tell them why you're perfect for this opportunity..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowApplicationForm(false);
                    setSelectedHustle(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hustles;
10000
