import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, formatCurrency } from '../App';
import { 
  ChartBarIcon, 
  LightBulbIcon, 
  ArrowTrendingUpIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Enhanced currency formatter for large values
const formatLargeCurrency = (amount) => {
  if (amount >= 10000000) { // 1 crore
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) { // 1 lakh
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) { // 1 thousand
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
};

const Analytics = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState({});
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [insightsRes, summaryRes] = await Promise.all([
        axios.get(`${API}/analytics/insights`),
        axios.get(`${API}/transactions/summary`)
      ]);

      setInsights(insightsRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSavingsRate = () => {
    if (summary.income === 0) return 0;
    return ((summary.net_savings / summary.income) * 100).toFixed(1);
  };

  const getSpendingTrend = () => {
    const savingsRate = parseFloat(getSavingsRate());
    if (savingsRate > 20) return { text: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (savingsRate > 10) return { text: 'Good', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (savingsRate > 0) return { text: 'Fair', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { text: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-100' };
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded-xl"></div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const spendingTrend = getSpendingTrend();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 fade-in">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Analytics</h1>
        <p className="text-gray-600">AI-powered insights to help you make better financial decisions</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="stat-card card-hover slide-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Monthly Income</p>
              <p className="stat-value text-emerald-600">{formatLargeCurrency(summary.income || 0)}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full">
              <ArrowTrendingUpIcon className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="stat-card card-hover slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Monthly Expenses</p>
              <p className="stat-value text-red-500">{formatLargeCurrency(summary.expense || 0)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <CurrencyDollarIcon className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>

        <div className="stat-card card-hover slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Savings Rate</p>
              <p className="stat-value">{getSavingsRate()}%</p>
            </div>
            <div className={`p-3 ${spendingTrend.bg} rounded-full`}>
              <ChartBarIcon className={`w-6 h-6 ${spendingTrend.color}`} />
            </div>
          </div>
        </div>

        <div className="stat-card card-hover slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Financial Health</p>
              <p className={`text-lg font-bold ${spendingTrend.color}`}>{spendingTrend.text}</p>
            </div>
            <div className={`p-3 ${spendingTrend.bg} rounded-full`}>
              <CalendarIcon className={`w-6 h-6 ${spendingTrend.color}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Insights */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <LightBulbIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">AI Financial Insights</h2>
          </div>

          <div className="space-y-4">
            {insights.insights && insights.insights.length > 0 ? (
              insights.insights.map((insight, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
                  <p className="text-gray-700 leading-relaxed">{insight}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <LightBulbIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">Add more transactions to unlock AI insights!</p>
              </div>
            )}
          </div>
        </div>

        {/* Financial Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 slide-up" style={{ animationDelay: '0.5s' }}>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Your Financial Progress</h2>

          <div className="space-y-6">
            {/* Income vs Expenses */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Income vs Expenses</span>
                <span className="text-sm text-gray-500">This Month</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-emerald-600">Income</span>
                    <span className="text-xs font-semibold text-emerald-600">{formatLargeCurrency(summary.income || 0)}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill bg-emerald-500" 
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-red-600">Expenses</span>
                    <span className="text-xs font-semibold text-red-600">{formatLargeCurrency(summary.expense || 0)}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill bg-red-500" 
                      style={{ width: `${summary.income > 0 ? (summary.expense / summary.income) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Savings Goal */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Savings Goal</span>
                <span className="text-sm text-gray-500">20% Target</span>
              </div>
              
              <div className="progress-bar">
                <div 
                  className="progress-fill bg-blue-500" 
                  style={{ width: `${Math.min(parseFloat(getSavingsRate()), 100)}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">Current: {getSavingsRate()}%</span>
                <span className="text-xs text-gray-500">Target: 20%</span>
              </div>
            </div>

            {/* Monthly Streak */}
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Income Streak</h3>
                  <p className="text-sm text-gray-600">Days with recorded income</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-600">{user?.current_streak || 0}</p>
                  <p className="text-xs text-yellow-700">days</p>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
              <h3 className="font-semibold text-gray-900 mb-2">💡 Quick Tips</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Track every transaction to get better insights</li>
                <li>• Aim to save at least 20% of your income</li>
                <li>• Focus on high-paying side hustles for better ROI</li>
                <li>• Review your spending weekly to stay on track</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Future Goals Section */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 slide-up" style={{ animationDelay: '0.6s' }}>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Financial Goals</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CurrencyDollarIcon className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Emergency Fund</h3>
            <p className="text-sm text-gray-600 mb-2">Build 3 months of expenses</p>
            <p className="text-lg font-bold text-emerald-600">{formatLargeCurrency((summary.expense || 0) * 3)}</p>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ArrowTrendingUpIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Monthly Income Goal</h3>
            <p className="text-sm text-gray-600 mb-2">Increase by 50%</p>
            <p className="text-lg font-bold text-blue-600">{formatLargeCurrency((summary.income || 0) * 1.5)}</p>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ChartBarIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Graduation Fund</h3>
            <p className="text-sm text-gray-600 mb-2">Save for post-graduation</p>
            <p className="text-lg font-bold text-emerald-600">{formatLargeCurrency(500000)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;