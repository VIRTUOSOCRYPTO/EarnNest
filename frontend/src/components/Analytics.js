import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, formatCurrency } from '../App';
import { 
  ChartBarIcon, 
  LightBulbIcon, 
  ArrowTrendingUpIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon
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
  const [goals, setGoals] = useState([]);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalForm, setGoalForm] = useState({ name: '', target_amount: '', description: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [insightsRes, summaryRes, goalsRes] = await Promise.all([
        axios.get(`${API}/analytics/insights`),
        axios.get(`${API}/transactions/summary`),
        axios.get(`${API}/financial-goals`)
      ]);

      setInsights(insightsRes.data);
      setSummary(summaryRes.data);
      setGoals(goalsRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    try {
      const response = await axios.post(`${API}/financial-goals`, {
        name: goalForm.name,
        target_amount: parseFloat(goalForm.target_amount),
        description: goalForm.description,
        category: goalForm.category || 'custom'
      });
      
      setGoals([...goals, response.data]);
      setGoalForm({ name: '', target_amount: '', description: '', category: 'custom' });
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Failed to create goal. Please try again.');
    }
  };

  const handleUpdateGoal = async (goalId, updateData) => {
    try {
      await axios.put(`${API}/financial-goals/${goalId}`, updateData);
      
      setGoals(goals.map(goal => 
        goal.id === goalId ? { ...goal, ...updateData } : goal
      ));
      setEditingGoal(null);
    } catch (error) {
      console.error('Error updating goal:', error);
      alert('Failed to update goal. Please try again.');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    
    try {
      await axios.delete(`${API}/financial-goals/${goalId}`);
      setGoals(goals.filter(goal => goal.id !== goalId));
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Failed to delete goal. Please try again.');
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
      <div className="responsive-container py-6 sm:py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="responsive-grid cols-1 cols-lg-2">
            <div className="h-96 bg-gray-200 rounded-xl"></div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const spendingTrend = getSpendingTrend();

  return (
    <div className="responsive-container py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Financial Analytics</h1>
        <p className="text-gray-600">AI-powered insights to help you make better financial decisions</p>
      </div>

      {/* Overview Cards */}
      <div className="responsive-grid cols-1 cols-md-2 cols-lg-4 mb-6 sm:mb-8">
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
                  <p className="text-2xl font-bold text-yellow-600">{insights?.income_streak || 0}</p>
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

      {/* Financial Goals Section */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 slide-up" style={{ animationDelay: '0.6s' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Financial Goals</h2>
          <button
            onClick={() => setEditingGoal('new')}
            className="flex items-center px-4 py-2 btn-primary text-white rounded-lg transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Goal
          </button>
        </div>
        
        {goals.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <ChartBarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Financial Goals Yet</h3>
            <p className="text-gray-600 mb-4">Start by creating your first financial goal to track your progress.</p>
            <button
              onClick={() => setEditingGoal('new')}
              className="px-6 py-2 btn-primary text-white rounded-lg transition-colors"
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <div key={goal.id} className="relative p-4 bg-white rounded-lg shadow-sm group">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setEditingGoal(goal)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                  goal.category === 'emergency_fund' ? 'bg-emerald-100' :
                  goal.category === 'monthly_income' ? 'bg-blue-100' :
                  goal.category === 'graduation' ? 'bg-purple-100' :
                  'bg-gray-100'
                }`}>
                  {goal.category === 'emergency_fund' ? (
                    <CurrencyDollarIcon className="w-6 h-6 text-emerald-600" />
                  ) : goal.category === 'monthly_income' ? (
                    <ArrowTrendingUpIcon className="w-6 h-6 text-blue-600" />
                  ) : goal.category === 'graduation' ? (
                    <ChartBarIcon className="w-6 h-6 text-purple-600" />
                  ) : (
                    <ChartBarIcon className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-1 text-center">{goal.name}</h3>
                <p className="text-sm text-gray-600 mb-2 text-center">{goal.description}</p>
                
                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>₹{formatCurrency(goal.current_amount)}</span>
                    <span>₹{formatCurrency(goal.target_amount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        goal.category === 'emergency_fund' ? 'bg-emerald-600' :
                        goal.category === 'monthly_income' ? 'bg-blue-600' :
                        goal.category === 'graduation' ? 'bg-purple-600' :
                        'bg-gray-600'
                      }`}
                      style={{ width: `${Math.min((goal.current_amount / goal.target_amount) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <p className={`text-center font-bold ${
                  goal.category === 'emergency_fund' ? 'text-emerald-600' :
                  goal.category === 'monthly_income' ? 'text-blue-600' :
                  goal.category === 'graduation' ? 'text-purple-600' :
                  'text-gray-600'
                }`}>
                  {Math.round((goal.current_amount / goal.target_amount) * 100)}% Complete
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Goal Creation/Editing Modal */}
        {editingGoal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {editingGoal === 'new' ? 'Create New Goal' : 'Edit Goal'}
                </h3>
                <button
                  onClick={() => {
                    setEditingGoal(null);
                    setGoalForm({ name: '', target_amount: '', description: '', category: 'custom' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Goal Name</label>
                  <input
                    type="text"
                    value={editingGoal === 'new' ? goalForm.name : editingGoal.name}
                    onChange={(e) => {
                      if (editingGoal === 'new') {
                        setGoalForm({ ...goalForm, name: e.target.value });
                      } else {
                        setEditingGoal({ ...editingGoal, name: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Emergency Fund"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount (₹)</label>
                  <input
                    type="number"
                    value={editingGoal === 'new' ? goalForm.target_amount : editingGoal.target_amount}
                    onChange={(e) => {
                      if (editingGoal === 'new') {
                        setGoalForm({ ...goalForm, target_amount: e.target.value });
                      } else {
                        setEditingGoal({ ...editingGoal, target_amount: parseFloat(e.target.value) });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="50000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editingGoal === 'new' ? goalForm.description : editingGoal.description}
                    onChange={(e) => {
                      if (editingGoal === 'new') {
                        setGoalForm({ ...goalForm, description: e.target.value });
                      } else {
                        setEditingGoal({ ...editingGoal, description: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your goal..."
                    rows="3"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={editingGoal === 'new' ? goalForm.category : editingGoal.category}
                    onChange={(e) => {
                      if (editingGoal === 'new') {
                        setGoalForm({ ...goalForm, category: e.target.value });
                      } else {
                        setEditingGoal({ ...editingGoal, category: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="emergency_fund">Emergency Fund</option>
                    <option value="monthly_income">Monthly Income Goal</option>
                    <option value="graduation">Graduation Fund</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setEditingGoal(null);
                    setGoalForm({ name: '', target_amount: '', description: '', category: 'custom' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (editingGoal === 'new') {
                      if (goalForm.name && goalForm.target_amount) {
                        handleCreateGoal();
                      }
                    } else {
                      handleUpdateGoal(editingGoal.id, {
                        name: editingGoal.name,
                        target_amount: editingGoal.target_amount,
                        description: editingGoal.description,
                        category: editingGoal.category
                      });
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingGoal === 'new' ? 'Create Goal' : 'Update Goal'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
