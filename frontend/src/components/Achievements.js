import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { getTranslation } from '../translations';
import { useWebSocket } from '../hooks/useWebSocket';
import { 
  TrophyIcon, 
  LockClosedIcon,
  CurrencyRupeeIcon,
  FireIcon,
  HeartIcon,
  AcademicCapIcon,
  UsersIcon,
  GiftIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Achievements = () => {
  const { user } = useAuth();
  const { realTimeData, isConnected } = useWebSocket();
  const [allAchievements, setAllAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [language, setLanguage] = useState(user?.preferred_language || 'en');
  const [animatingAchievements, setAnimatingAchievements] = useState(new Set());

  const t = (category, key) => getTranslation(category, key, language);

  useEffect(() => {
    fetchAchievements();
  }, []);

  // Handle real-time achievement updates
  useEffect(() => {
    if (realTimeData.achievements.length > 0) {
      const newAchievements = realTimeData.achievements;
      
      newAchievements.forEach(achievement => {
        // Add animation class for newly unlocked achievements
        setAnimatingAchievements(prev => new Set([...prev, achievement.id]));
        
        // Remove animation after 3 seconds
        setTimeout(() => {
          setAnimatingAchievements(prev => {
            const newSet = new Set(prev);
            newSet.delete(achievement.id);
            return newSet;
          });
        }, 3000);
        
        // Update the achievements list
        setAllAchievements(prev => 
          prev.map(a => 
            a.id === achievement.id 
              ? { ...a, earned: true, earned_at: new Date().toISOString() }
              : a
          )
        );
        
        setUserAchievements(prev => [
          ...prev.filter(a => a.id !== achievement.id),
          achievement
        ]);
      });
    }
  }, [realTimeData.achievements]);

  const fetchAchievements = async () => {
    try {
      const response = await axios.get(`${API}/viral/achievements`);
      const data = response.data;
      setAllAchievements(data.all_achievements);
      setUserAchievements(data.user_achievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      savings: CurrencyRupeeIcon,
      earning: TrophyIcon,
      streak: FireIcon,
      social: UsersIcon,
      cultural: GiftIcon,
      learning: AcademicCapIcon
    };
    return icons[category] || TrophyIcon;
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800',
      legendary: 'bg-purple-100 text-purple-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryColor = (category) => {
    const colors = {
      savings: 'from-emerald-500 to-green-600',
      earning: 'from-blue-500 to-indigo-600',
      streak: 'from-red-500 to-orange-600',
      social: 'from-purple-500 to-pink-600',
      cultural: 'from-yellow-500 to-orange-500',
      learning: 'from-teal-500 to-cyan-600'
    };
    return colors[category] || 'from-gray-500 to-gray-600';
  };

  const categories = ['all', 'savings', 'earning', 'streak', 'social', 'cultural', 'learning'];

  const filteredAchievements = allAchievements.filter(achievement => 
    selectedCategory === 'all' || achievement.category === selectedCategory
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('achievements', 'title')} 🏆
            </h1>
            <p className="text-gray-600">{t('achievements', 'subtitle')}</p>
          </div>
          {/* Real-time Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-500">
              {isConnected ? 'Live Updates' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100">Total Earned</p>
              <p className="text-3xl font-bold">{userAchievements.length}</p>
            </div>
            <TrophyIcon className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Total Available</p>
              <p className="text-3xl font-bold">{allAchievements.length}</p>
            </div>
            <GiftIcon className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Completion Rate</p>
              <p className="text-3xl font-bold">
                {allAchievements.length > 0 ? Math.round((userAchievements.length / allAchievements.length) * 100) : 0}%
              </p>
            </div>
            <FireIcon className="w-12 h-12 opacity-80" />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'All' : t('achievements', `categories.${category}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map(achievement => {
          const CategoryIcon = getCategoryIcon(achievement.category);
          const isEarned = achievement.earned;
          
          return (
            <div
              key={achievement.id}
              className={`rounded-2xl p-6 transition-all duration-200 hover:scale-105 ${
                isEarned
                  ? `bg-gradient-to-br ${getCategoryColor(achievement.category)} text-white shadow-lg`
                  : 'bg-white border border-gray-200 text-gray-900 shadow-sm hover:shadow-md'
              } ${animatingAchievements.has(achievement.id) ? 'animate-bounce ring-4 ring-yellow-400 ring-opacity-75' : ''}`}
            >
              {/* Achievement Icon & Status */}
              <div className="flex items-center justify-between mb-4">
                <div className={`text-4xl ${isEarned ? '' : 'grayscale opacity-50'}`}>
                  {achievement.badge_icon}
                </div>
                <div className="flex items-center gap-2">
                  {isEarned ? (
                    <div className="bg-white bg-opacity-20 px-2 py-1 rounded-full">
                      <span className="text-xs font-medium">{t('achievements', 'earned')}</span>
                    </div>
                  ) : (
                    <LockClosedIcon className="w-5 h-5 opacity-50" />
                  )}
                </div>
              </div>

              {/* Achievement Info */}
              <div className="mb-4">
                <h3 className={`font-bold text-lg mb-2 ${isEarned ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'hi' && achievement.name_hi ? achievement.name_hi :
                   language === 'ta' && achievement.name_ta ? achievement.name_ta :
                   achievement.name}
                </h3>
                <p className={`text-sm ${isEarned ? 'text-white text-opacity-90' : 'text-gray-600'}`}>
                  {language === 'hi' && achievement.description_hi ? achievement.description_hi :
                   language === 'ta' && achievement.description_ta ? achievement.description_ta :
                   achievement.description}
                </p>
              </div>

              {/* Category & Difficulty */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CategoryIcon className={`w-4 h-4 ${isEarned ? 'text-white' : 'text-gray-500'}`} />
                  <span className={`text-xs font-medium ${isEarned ? 'text-white text-opacity-90' : 'text-gray-600'}`}>
                    {t('achievements', `categories.${achievement.category}`)}
                  </span>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isEarned 
                    ? 'bg-white bg-opacity-20 text-white' 
                    : getDifficultyColor(achievement.difficulty)
                }`}>
                  {t('achievements', `difficulty.${achievement.difficulty}`)}
                </div>
              </div>

              {/* Progress Bar (if applicable) */}
              {achievement.points_required > 0 && !isEarned && (
                <div className="mt-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: '0%' }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    0 / {achievement.points_required} points
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <TrophyIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No achievements found in this category</p>
        </div>
      )}
    </div>
  );
};

export default Achievements;
