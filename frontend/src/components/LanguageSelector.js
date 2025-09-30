import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { getTranslation, getLanguages } from '../translations';
import { 
  LanguageIcon,
  CheckIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LanguageSelector = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const currentLanguage = user?.preferred_language || 'en';
  const languages = getLanguages();
  
  const t = (category, key) => getTranslation(category, key, currentLanguage);

  const handleLanguageChange = async (languageCode) => {
    if (languageCode === currentLanguage) {
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/viral/update-language`, {
        language_code: languageCode
      });

      if (response.data.success) {
        // Update user context with new language preference
        updateUser({ 
          ...user, 
          preferred_language: languageCode 
        });
        
        // Close dropdown
        setShowDropdown(false);
        
        // Show success message
        console.log('Language updated successfully!');
        
        // Optionally reload the page to apply translations
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating language:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === currentLanguage) || languages[0];
  };

  return (
    <div className="relative">
      {/* Language Toggle Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
        disabled={loading}
      >
        <GlobeAltIcon className="w-5 h-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {getCurrentLanguage().native}
        </span>
        <div className={`transform transition-transform ${showDropdown ? 'rotate-180' : ''}`}>
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Language Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
          <div className="py-2">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('language', 'select_language')}
              </p>
            </div>
            
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  language.code === currentLanguage ? 'bg-emerald-50' : ''
                }`}
                disabled={loading}
              >
                <div className="flex flex-col">
                  <span className={`font-medium ${
                    language.code === currentLanguage ? 'text-emerald-700' : 'text-gray-900'
                  }`}>
                    {language.native}
                  </span>
                  <span className="text-xs text-gray-500">
                    {language.name}
                  </span>
                </div>
                
                {language.code === currentLanguage && (
                  <CheckIcon className="w-5 h-5 text-emerald-600" />
                )}
              </button>
            ))}
          </div>
          
          {/* Current Language Indicator */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              {t('language', 'current_language')}: {getCurrentLanguage().native}
            </p>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
