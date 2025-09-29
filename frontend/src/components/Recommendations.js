import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LinkIcon, 
  StarIcon, 
  ShoppingBagIcon,
  FilmIcon,
  TruckIcon,
  BookOpenIcon,
  PlayIcon,
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Recommendations = () => {
  const [allSuggestions, setAllSuggestions] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [emergencyTypes, setEmergencyTypes] = useState([]);
  const [selectedEmergency, setSelectedEmergency] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);

  const categoryIcons = {
    'Food': ShoppingCartIcon,
    'Transportation': TruckIcon,
    'Books': BookOpenIcon,
    'Entertainment': PlayIcon,
    'Rent': ShoppingBagIcon,
    'Utilities': ExclamationTriangleIcon,
    'Movies': FilmIcon,
    'Shopping': ShoppingBagIcon,
    'Groceries': ShoppingCartIcon,
    'Subscriptions': StarIcon,
    'Emergency Fund': ExclamationTriangleIcon
  };

  const categories = ['Food', 'Transportation', 'Books', 'Entertainment', 'Rent', 'Utilities', 'Movies', 'Shopping', 'Groceries', 'Subscriptions', 'Emergency Fund'];

  useEffect(() => {
    fetchAllSuggestions();
    fetchEmergencyTypes();
  }, []);

  // Emergency services functions removed

  const fetchAllSuggestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const categoryPromises = categories.filter(cat => cat !== 'Emergency Fund').map(async (category) => {
        try {
          const response = await axios.get(`${API}/app-suggestions/${category.toLowerCase()}`, { headers });
          return { category, apps: response.data.apps || [] };
        } catch (error) {
          console.error(`Error fetching suggestions for ${category}:`, error);
          return { category, apps: [] };
        }
      });

      const results = await Promise.all(categoryPromises);
      const suggestions = {};
      
      results.forEach(({ category, apps }) => {
        suggestions[category] = apps;
      });

      setAllSuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmergencyTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/emergency-types`, { headers });
      setEmergencyTypes(response.data.emergency_types || []);
    } catch (error) {
      console.error('Error fetching emergency types:', error);
    }
  };

  const fetchHospitals = async (emergencyType) => {
    if (!emergencyType) return;
    
    setLoadingHospitals(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const locationData = {
        latitude: 12.9716, // Default to Bangalore coordinates
        longitude: 77.5946
      };
      
      const response = await axios.post(`${API}/emergency-hospitals`, {
        ...locationData,
        emergency_type: emergencyType
      }, { headers });
      setHospitals(response.data.hospitals || []);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      setHospitals([]);
    } finally {
      setLoadingHospitals(false);
    }
  };

  const handleSuggestionClick = async (suggestion, category) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Track click
      await axios.post(`${API}/track-suggestion-click`, {
        category: category,
        suggestion_name: suggestion.name,
        suggestion_url: suggestion.url,
        user_location: null
      }, { headers });
      
      // Open in new tab
      window.open(suggestion.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error tracking suggestion click:', error);
      // Still open the link even if tracking fails
      window.open(suggestion.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleEmergencySelect = (emergencyType) => {
    setSelectedEmergency(emergencyType);
    fetchHospitals(emergencyType);
  };

  const handleHospitalCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  const handleGoogleSearch = (category) => {
    const searchQueries = {
      'Food': 'best food delivery apps restaurants near me',
      'Transportation': 'best transportation apps ride sharing public transport',
      'Books': 'best book reading apps online bookstores',
      'Entertainment': 'best entertainment apps streaming services',
      'Rent': 'best rental apps apartment finder real estate',
      'Utilities': 'best utility apps bill payment services',
      'Movies': 'best movie streaming apps cinema booking',
      'Shopping': 'best shopping apps online stores deals',
      'Groceries': 'best grocery delivery apps supermarket online',
      'Subscriptions': 'best subscription management apps services',
      'Emergency Fund': 'emergency fund savings apps financial planning'
    };
    
    const query = searchQueries[category] || `best ${category.toLowerCase()} apps`;
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(googleUrl, '_blank', 'noopener,noreferrer');
  };

  const filteredCategories = [selectedCategory].filter(cat => 
    cat === 'Emergency Fund' || allSuggestions[cat]
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Recommendations</h1>
        <p className="text-gray-600">Discover the best apps and websites for your expense categories</p>
      </div>

      {/* Emergency Services Section Removed */}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedCategory === category
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Regular Category Suggestions */}
      <div className="space-y-8">
        {filteredCategories.map((category) => {
          if (category === 'Emergency Fund') {
            return null; // Emergency Fund is handled separately below
          }
          
          const Icon = categoryIcons[category];
          const suggestions = allSuggestions[category] || [];
          
          return (
            <div key={category} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                {Icon && <Icon className="w-6 h-6 text-emerald-600" />}
                <h2 className="text-xl font-semibold text-gray-900">{category}</h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {suggestions.length} options
                </span>
              </div>
              
              {suggestions.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion, category)}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200 text-left group"
                      >
                        <div className="flex-shrink-0 relative">
                          <div className="w-12 h-12 rounded-lg bg-white p-1 flex items-center justify-center">
                            {suggestion.logo ? (
                              <img 
                                src={suggestion.logo} 
                                alt={`${suggestion.name} logo`}
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                  // Hide the image and show fallback
                                  e.target.style.display = 'none';
                                  const fallback = document.createElement('div');
                                  fallback.className = 'w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm';
                                  fallback.textContent = suggestion.name.charAt(0);
                                  e.target.parentElement.appendChild(fallback);
                                }}
                                style={{maxWidth: '100%', maxHeight: '100%'}}
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                {suggestion.name.charAt(0)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {suggestion.name}
                            </h3>
                            {suggestion.price_comparison && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                Compare Prices
                              </span>
                            )}
                          </div>
                          {suggestion.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {suggestion.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                              {suggestion.type}
                            </span>
                          </div>
                        </div>
                        <LinkIcon className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                  
                  {/* Search on Google Button */}
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => handleGoogleSearch(category)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Search on Google
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-500 text-center py-8">No suggestions available for this category.</p>
                  
                  {/* Search on Google Button for empty categories */}
                  <div className="text-center">
                    <button
                      onClick={() => handleGoogleSearch(category)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Search on Google
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Emergency Fund Special Section */}
      {selectedCategory === 'Emergency Fund' && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl shadow-lg p-6 border border-red-200">
        <div className="flex items-center gap-3 mb-6">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
          <h2 className="text-xl font-semibold text-gray-900">Emergency Fund - Hospital Finder</h2>
        </div>
        
        <div className="space-y-6">
          {/* Emergency Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              What type of emergency?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {emergencyTypes.map((type, index) => (
                <button
                  key={index}
                  onClick={() => handleEmergencySelect(type.name)}
                  className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                    selectedEmergency === type.name
                      ? 'border-red-300 bg-red-50 text-red-800'
                      : 'border-gray-200 bg-white hover:border-red-200 hover:bg-red-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{type.icon}</span>
                    <div>
                      <h3 className="font-medium text-sm">{type.name}</h3>
                      <p className="text-xs text-gray-600">{type.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Hospital Results */}
          {selectedEmergency && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Nearby Hospitals for {selectedEmergency}
              </h3>
              
              {loadingHospitals ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  <span className="ml-2 text-gray-600">Finding hospitals...</span>
                </div>
              ) : hospitals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hospitals.map((hospital, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                          {hospital.name}
                        </h4>
                        {hospital.rating && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                            <StarIcon className="w-3 h-3 fill-current" />
                            {hospital.rating}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-xs">{hospital.address}</span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleHospitalCall(hospital.phone)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <PhoneIcon className="w-4 h-4" />
                            <span className="text-xs">{hospital.phone}</span>
                          </button>
                          
                          {hospital.emergency_phone && (
                            <button
                              onClick={() => handleHospitalCall(hospital.emergency_phone)}
                              className="flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors"
                            >
                              <PhoneIcon className="w-4 h-4" />
                              <span className="text-xs font-medium">Emergency: {hospital.emergency_phone}</span>
                            </button>
                          )}
                        </div>

                        {hospital.specialties && hospital.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {hospital.specialties.slice(0, 3).map((specialty, idx) => (
                              <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                {specialty}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-2 text-xs">
                          {hospital.is_24x7 && (
                            <span className="text-green-600 font-medium">24/7</span>
                          )}
                          <span className="text-gray-500 capitalize">{hospital.type}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No hospitals found for this emergency type. Try selecting a different emergency type.
                </p>
              )}
            </div>
          )}
          
          {/* Search on Google Button for Emergency Fund */}
          <div className="mt-6 text-center">
            <button
              onClick={() => handleGoogleSearch('Emergency Fund')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Search Emergency Fund Apps on Google
            </button>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default Recommendations;
