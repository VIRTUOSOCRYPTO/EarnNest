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
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [emergencyTypes, setEmergencyTypes] = useState([]);
  const [selectedEmergency, setSelectedEmergency] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [userLocation, setUserLocation] = useState('');

  const categoryIcons = {
    'Movies': FilmIcon,
    'Transportation': TruckIcon,
    'Shopping': ShoppingBagIcon,
    'Food': ShoppingCartIcon,
    'Groceries': ShoppingCartIcon,
    'Entertainment': PlayIcon,
    'Books': BookOpenIcon
  };

  const categories = ['All', 'Movies', 'Transportation', 'Shopping', 'Food', 'Groceries', 'Entertainment', 'Books'];

  useEffect(() => {
    fetchAllSuggestions();
    fetchEmergencyTypes();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
        },
        (error) => {
          console.log('Location access denied or failed:', error);
          setUserLocation('Mumbai, Maharashtra'); // Default location
        }
      );
    }
  };

  const fetchAllSuggestions = async () => {
    try {
      const response = await axios.get(`${API}/categories/all-suggestions`);
      setAllSuggestions(response.data.categories || {});
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmergencyTypes = async () => {
    try {
      const response = await axios.get(`${API}/emergency/types`);
      setEmergencyTypes(response.data.emergency_types || []);
    } catch (error) {
      console.error('Error fetching emergency types:', error);
    }
  };

  const fetchHospitals = async (emergencyType) => {
    if (!emergencyType) return;
    
    setLoadingHospitals(true);
    try {
      const params = {
        emergency_type: emergencyType,
        city: 'Mumbai', // Could be enhanced with user's actual city
        limit: 8
      };
      
      const response = await axios.get(`${API}/emergency/hospitals`, { params });
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
      // Track click
      await axios.post(`${API}/track-suggestion-click`, {
        category: category,
        suggestion_name: suggestion.name,
        suggestion_url: suggestion.url,
        user_location: userLocation
      });
      
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

  const filteredCategories = selectedCategory === 'All' 
    ? Object.keys(allSuggestions)
    : [selectedCategory].filter(cat => allSuggestions[cat]);

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion, category)}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200 text-left group"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                          {suggestion.name.charAt(0)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {suggestion.name}
                          </h3>
                          {suggestion.is_popular && (
                            <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                          )}
                        </div>
                        {suggestion.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {suggestion.description}
                          </p>
                        )}
                        {suggestion.offers && (
                          <p className="text-sm text-emerald-600 font-medium mt-1">
                            {suggestion.offers}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                            {suggestion.type}
                          </span>
                          {suggestion.click_count > 0 && (
                            <span className="text-xs text-gray-500">
                              {suggestion.click_count} clicks
                            </span>
                          )}
                        </div>
                      </div>
                      <LinkIcon className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No suggestions available for this category.</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Emergency Fund Special Section */}
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
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
