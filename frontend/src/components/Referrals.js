import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { getTranslation, getLanguages } from '../translations';
import { 
  ShareIcon, 
  ClipboardDocumentIcon,
  TrophyIcon,
  UserGroupIcon,
  CurrencyRupeeIcon,
  GiftIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Referrals = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [recentReferrals, setRecentReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState(user?.preferred_language || 'en');

  const t = (category, key) => getTranslation(category, key, language);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const response = await axios.get(`${API}/viral/referral-stats`);
      const data = response.data;
      setStats(data.stats);
      setRecentReferrals(data.recent_referrals);
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `https://earnnest.com/register?ref=${user?.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const message = encodeURIComponent(
      `${t('referrals', 'invite_message')} Use my referral code: ${user?.referral_code} - https://earnnest.com/register?ref=${user?.referral_code}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
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
          {t('referrals', 'title')} 🎁
        </h1>
        <p className="text-gray-600">{t('referrals', 'subtitle')}</p>
      </div>

      {/* Referral Code Card */}
      <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-6 mb-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-bold mb-2">{t('referrals', 'your_referral_code')}</h2>
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-3 inline-block">
              <span className="text-2xl font-mono font-bold tracking-wider">
                {user?.referral_code}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={copyReferralLink}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              {copied ? (
                <CheckIcon className="w-5 h-5" />
              ) : (
                <ClipboardDocumentIcon className="w-5 h-5" />
              )}
              {copied ? 'Copied!' : t('referrals', 'copy_link')}
            </button>
            <button
              onClick={shareWhatsApp}
              className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <ShareIcon className="w-5 h-5" />
              {t('referrals', 'send_whatsapp')}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('referrals', 'total_referrals')}</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total_referrals || 0}</p>
            </div>
            <UserGroupIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('referrals', 'successful_referrals')}</p>
              <p className="text-3xl font-bold text-emerald-600">{stats.completed_referrals || 0}</p>
            </div>
            <TrophyIcon className="w-8 h-8 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('referrals', 'pending_referrals')}</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending_referrals || 0}</p>
            </div>
            <GiftIcon className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('referrals', 'coins_earned')}</p>
              <p className="text-3xl font-bold text-purple-600">{stats.total_coins_earned || 0}</p>
            </div>
            <CurrencyRupeeIcon className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Recent Referrals */}
      {recentReferrals.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('referrals', 'recent_referrals')}
          </h3>
          <div className="space-y-3">
            {recentReferrals.map((referral, index) => (
              <div key={referral.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                    {referral.referee_email ? referral.referee_email.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {referral.referee_email || 'Invited User'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    referral.status === 'completed' 
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {referral.status === 'completed' ? 'Joined' : 'Pending'}
                  </div>
                  {referral.coins_earned > 0 && (
                    <p className="text-sm text-purple-600 font-medium mt-1">
                      +{referral.coins_earned} coins
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 mt-8 text-white">
        <h3 className="text-xl font-bold mb-4">How Referrals Work 🚀</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="text-2xl mb-2">1️⃣</div>
            <h4 className="font-semibold mb-2">Share Your Code</h4>
            <p className="text-sm opacity-90">
              Share your unique referral code with friends and family
            </p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="text-2xl mb-2">2️⃣</div>
            <h4 className="font-semibold mb-2">Friend Joins</h4>
            <p className="text-sm opacity-90">
              When they sign up using your code, they get 25 welcome coins
            </p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="text-2xl mb-2">3️⃣</div>
            <h4 className="font-semibold mb-2">You Both Win</h4>
            <p className="text-sm opacity-90">
              You get 50 EarnCoins and they get 25 coins to start their journey
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Referrals;
