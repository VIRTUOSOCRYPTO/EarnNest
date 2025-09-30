import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { getTranslation } from '../translations';
import { 
  TrophyIcon,
  FireIcon,
  CurrencyRupeeIcon,
  UsersIcon,
  ClockIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Challenges = () => {
  const { user } = useAuth();
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [userChallenges, setUserChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  const [language, setLanguage] = useState(user?.preferred_language || 'en');

  const t = (category, key) => getTranslation(category, key, language);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await axios.get(`${API}/viral/challenges`);
      const data = response.data;
      setActiveChallenges(data.active_challenges);
      setUserChallenges(data.user_challenges);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinChallenge = async (challengeId) => {
    try {
      const response = await axios.post(`${API}/viral/join-challenge`, {
        challenge_id: challengeId
      });

      if (response.data.success) {
        fetchChallenges(); // Refresh data
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
    }
  };

  const getChallengeTypeIcon = (type) => {
    const icons = {
      saving: CurrencyRupeeIcon,
      earning: TrophyIcon,
      streak: FireIcon,
      social: UsersIcon,
      cultural: FireIcon
    };
    return icons[type] || TrophyIcon;
  };

  const getChallengeTypeColor = (type) => {
    const colors = {
      saving: 'from-emerald-500 to-green-600',
      earning: 'from-blue-500 to-indigo-600',
      streak: 'from-red-500 to-orange-600',
      social: 'from-purple-500 to-pink-600',
      cultural: 'from-yellow-500 to-orange-500'
    };
    return colors[type] || 'from-gray-500 to-gray-600';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const getRemainingDays = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-80 bg-gray-200 rounded-xl"></div>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('challenges', 'title')} 🎯
        </h1>
        <p className="text-gray-600">{t('challenges', 'subtitle')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100">Active Challenges</p>
              <p className="text-3xl font-bold">{activeChallenges.length}</p>
            </div>
            <PlayIcon className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Joined Challenges</p>
              <p className="text-3xl font-bold">{userChallenges.length}</p>
            </div>
            <TrophyIcon className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Completed</p>
              <p className="text-3xl font-bold">
                {userChallenges.filter(uc => uc.status === 'completed').length}
              </p>
            </div>
            <CheckCircleIcon className="w-12 h-12 opacity-80" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'available'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('challenges', 'active_challenges')}
          </button>
          <button
            onClick={() => setActiveTab('joined')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'joined'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('challenges', 'my_challenges')} ({userChallenges.length})
          </button>
        </div>
      </div>

      {/* Available Challenges */}
      {activeTab === 'available' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeChallenges.map(challenge => {
            const TypeIcon = getChallengeTypeIcon(challenge.challenge_type);
            const remainingDays = getRemainingDays(challenge.end_date);
            const isJoined = challenge.joined;
            
            return (
              <div
                key={challenge.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Challenge Header */}
                <div className={`p-6 bg-gradient-to-r ${getChallengeTypeColor(challenge.challenge_type)} text-white`}>
                  <div className="flex items-center justify-between mb-3">
                    <TypeIcon className="w-8 h-8" />
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty)} text-gray-800`}>
                      {challenge.difficulty}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">
                    {language === 'hi' && challenge.name_hi ? challenge.name_hi :
                     language === 'ta' && challenge.name_ta ? challenge.name_ta :
                     challenge.name}
                  </h3>
                  
                  <p className="text-sm opacity-90">
                    {language === 'hi' && challenge.description_hi ? challenge.description_hi :
                     language === 'ta' && challenge.description_ta ? challenge.description_ta :
                     challenge.description}
                  </p>
                </div>

                {/* Challenge Details */}
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Target */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Target:</span>
                      <span className="font-semibold text-gray-900">
                        {challenge.target_value} {challenge.target_unit}
                      </span>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-semibold text-gray-900">
                        {challenge.duration_days} days
                      </span>
                    </div>

                    {/* Time Remaining */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Time Left:</span>
                      <div className="flex items-center gap-1 font-semibold text-orange-600">
                        <ClockIcon className="w-4 h-4" />
                        {remainingDays} {t('challenges', 'days_remaining')}
                      </div>
                    </div>

                    {/* Reward */}
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <span className="text-yellow-800 font-medium">{t('challenges', 'reward')}:</span>
                      <div className="flex items-center gap-1 text-yellow-800 font-bold">
                        <TrophyIcon className="w-4 h-4" />
                        {challenge.reward_coins} {t('challenges', 'coins')}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => joinChallenge(challenge.id)}
                      disabled={isJoined || remainingDays === 0}
                      className={`w-full py-3 rounded-lg font-medium transition-colors ${
                        isJoined
                          ? 'bg-green-100 text-green-800 cursor-not-allowed'
                          : remainingDays === 0
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      }`}
                    >
                      {isJoined ? 'Already Joined' : 
                       remainingDays === 0 ? 'Challenge Ended' :
                       t('challenges', 'join_challenge')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* My Challenges */}
      {activeTab === 'joined' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userChallenges.map(userChallenge => {
            const challenge = userChallenge.challenge;
            const TypeIcon = getChallengeTypeIcon(challenge.challenge_type);
            const progress = getProgressPercentage(userChallenge.current_progress, 100);
            const remainingDays = getRemainingDays(challenge.end_date);
            const isCompleted = userChallenge.status === 'completed';
            
            return (
              <div
                key={userChallenge.id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                  isCompleted ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100'
                }`}
              >
                {/* Challenge Header */}
                <div className={`p-6 bg-gradient-to-r ${getChallengeTypeColor(challenge.challenge_type)} text-white`}>
                  <div className="flex items-center justify-between mb-3">
                    <TypeIcon className="w-8 h-8" />
                    {isCompleted && <CheckCircleIcon className="w-8 h-8" />}
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">
                    {language === 'hi' && challenge.name_hi ? challenge.name_hi :
                     language === 'ta' && challenge.name_ta ? challenge.name_ta :
                     challenge.name}
                  </h3>
                  
                  {isCompleted && (
                    <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full inline-block">
                      <span className="text-sm font-medium">
                        {t('challenges', 'challenge_completed')} 🎉
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {t('challenges', 'progress')}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Current Progress */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Current Progress:</span>
                      <span className="font-semibold text-gray-900">
                        {userChallenge.current_progress.toFixed(1)}%
                      </span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status:</span>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        userChallenge.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : userChallenge.status === 'active'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {userChallenge.status}
                      </div>
                    </div>

                    {/* Time */}
                    {!isCompleted && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Time Left:</span>
                        <span className="font-semibold text-orange-600">
                          {remainingDays} days
                        </span>
                      </div>
                    )}

                    {/* Reward */}
                    <div className={`flex items-center justify-between p-3 rounded-lg ${
                      userChallenge.reward_claimed
                        ? 'bg-emerald-100'
                        : 'bg-yellow-50'
                    }`}>
                      <span className={`font-medium ${
                        userChallenge.reward_claimed ? 'text-emerald-800' : 'text-yellow-800'
                      }`}>
                        {t('challenges', 'reward')}:
                      </span>
                      <div className={`flex items-center gap-1 font-bold ${
                        userChallenge.reward_claimed ? 'text-emerald-800' : 'text-yellow-800'
                      }`}>
                        {userChallenge.reward_claimed ? (
                          <>
                            <CheckCircleIcon className="w-4 h-4" />
                            Claimed
                          </>
                        ) : (
                          <>
                            <TrophyIcon className="w-4 h-4" />
                            {challenge.reward_coins} coins
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty States */}
      {activeTab === 'available' && activeChallenges.length === 0 && (
        <div className="text-center py-12">
          <TrophyIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No active challenges available</p>
        </div>
      )}

      {activeTab === 'joined' && userChallenges.length === 0 && (
        <div className="text-center py-12">
          <PlayIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">You haven't joined any challenges yet</p>
          <p className="text-gray-400 mt-2">Join some challenges to start earning rewards!</p>
          <button
            onClick={() => setActiveTab('available')}
            className="mt-4 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
          >
            Browse Challenges
          </button>
        </div>
      )}
    </div>
  );
};

export default Challenges;
