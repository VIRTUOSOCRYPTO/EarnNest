import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, formatCurrency } from '../App';
import { getTranslation } from '../translations';
import { useWebSocket } from '../hooks/useWebSocket';
import { 
  CalendarDaysIcon,
  PlusIcon,
  CurrencyRupeeIcon,
  GiftIcon,
  SparklesIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Festivals = () => {
  const { user } = useAuth();
  const { isConnected } = useWebSocket();
  const [festivals, setFestivals] = useState([]);
  const [userBudgets, setUserBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateBudget, setShowCreateBudget] = useState(false);
  const [selectedFestival, setSelectedFestival] = useState(null);
  const [budgetForm, setBudgetForm] = useState({
    total_budget: '',
    allocated_budgets: {}
  });
  const [language, setLanguage] = useState(user?.preferred_language || 'en');
  const [countdowns, setCountdowns] = useState({});

  const t = (category, key) => getTranslation(category, key, language);

  useEffect(() => {
    fetchFestivals();
    fetchUserBudgets();
  }, []);

  // Real-time countdown timer
  useEffect(() => {
    const updateCountdowns = () => {
      const now = new Date();
      const newCountdowns = {};
      
      festivals.forEach(festival => {
        const festivalDate = new Date(festival.date);
        const timeDiff = festivalDate.getTime() - now.getTime();
        
        if (timeDiff > 0) {
          const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
          
          newCountdowns[festival.id] = {
            days,
            hours,
            minutes,
            seconds,
            totalMs: timeDiff
          };
        } else {
          newCountdowns[festival.id] = null; // Festival has passed
        }
      });
      
      setCountdowns(newCountdowns);
    };

    // Update immediately
    updateCountdowns();
    
    // Update every second
    const interval = setInterval(updateCountdowns, 1000);
    
    return () => clearInterval(interval);
  }, [festivals]);

  const fetchFestivals = async () => {
    try {
      const response = await axios.get(`${API}/viral/festivals?upcoming_only=true`);
      setFestivals(response.data.festivals);
    } catch (error) {
      console.error('Error fetching festivals:', error);
    }
  };

  const fetchUserBudgets = async () => {
    try {
      const response = await axios.get(`${API}/viral/festival-budgets`);
      setUserBudgets(response.data.budgets);
    } catch (error) {
      console.error('Error fetching user budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateBudget = (festival) => {
    setSelectedFestival(festival);
    setShowCreateBudget(true);
    
    // Initialize form with festival suggestions
    const suggestions = festival.budget_suggestions || {};
    setBudgetForm({
      total_budget: Object.values(suggestions).reduce((sum, val) => sum + val, 0).toString(),
      allocated_budgets: suggestions
    });
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(`${API}/viral/festival-budget`, {
        festival_id: selectedFestival.id,
        total_budget: parseFloat(budgetForm.total_budget),
        allocated_budgets: budgetForm.allocated_budgets
      });

      if (response.data.success) {
        fetchUserBudgets();
        setShowCreateBudget(false);
        setSelectedFestival(null);
        setBudgetForm({ total_budget: '', allocated_budgets: {} });
      }
    } catch (error) {
      console.error('Error creating budget:', error);
    }
  };

  const updateCategoryBudget = (category, amount) => {
    setBudgetForm(prev => ({
      ...prev,
      allocated_budgets: {
        ...prev.allocated_budgets,
        [category]: parseFloat(amount) || 0
      }
    }));
  };

  const getFestivalIcon = (type) => {
    const icons = {
      national: '🇮🇳',
      regional: '🏛️',
      religious: '🕉️',
      modern: '🎊'
    };
    return icons[type] || '🎉';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('festivals', 'title')} 🎊
        </h1>
        <p className="text-gray-600">{t('festivals', 'subtitle')}</p>
      </div>

      {/* User's Festival Budgets */}
      {userBudgets.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Festival Budgets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userBudgets.map(budget => {
              const festival = budget.festival;
              const totalAllocated = Object.values(budget.allocated_budgets || {}).reduce((sum, val) => sum + val, 0);
              const totalSpent = Object.values(budget.spent_amounts || {}).reduce((sum, val) => sum + val, 0);
              const percentage = budget.total_budget > 0 ? (totalSpent / budget.total_budget) * 100 : 0;
              
              return (
                <div key={budget.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{festival.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {language === 'hi' && festival.name_hi ? festival.name_hi :
                           language === 'ta' && festival.name_ta ? festival.name_ta :
                           festival.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(festival.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(budget.total_budget)}
                      </p>
                    </div>
                  </div>

                  {/* Budget Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Spent: {formatCurrency(totalSpent)}</span>
                      <span>Remaining: {formatCurrency(budget.total_budget - totalSpent)}</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  <div className="space-y-2">
                    {Object.entries(budget.allocated_budgets || {}).map(([category, amount]) => {
                      const spent = budget.spent_amounts?.[category] || 0;
                      const remaining = amount - spent;
                      
                      return (
                        <div key={category} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 capitalize">
                            {t('festivals', `categories.${category.toLowerCase()}`) || category}
                          </span>
                          <span className={`font-medium ${remaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatCurrency(remaining)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Festivals */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t('festivals', 'upcoming_festivals')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {festivals.map(festival => {
            const hasExistingBudget = userBudgets.some(budget => budget.festival_id === festival.id);
            const daysUntil = Math.ceil((new Date(festival.date) - new Date()) / (1000 * 60 * 60 * 24));
            const countdown = countdowns[festival.id];
            
            return (
              <div 
                key={festival.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Festival Header */}
                <div className={`p-6 bg-gradient-to-r ${
                  festival.festival_type === 'national' ? 'from-orange-500 to-red-600' :
                  festival.festival_type === 'religious' ? 'from-purple-500 to-pink-600' :
                  festival.festival_type === 'regional' ? 'from-blue-500 to-indigo-600' :
                  'from-green-500 to-teal-600'
                } text-white`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">{festival.icon}</span>
                    <div className="text-right">
                      <div className="text-xs opacity-75">
                        {getFestivalIcon(festival.festival_type)} {festival.festival_type}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    {language === 'hi' && festival.name_hi ? festival.name_hi :
                     language === 'ta' && festival.name_ta ? festival.name_ta :
                     festival.name}
                  </h3>
                  <p className="text-sm opacity-90 mb-3">
                    {language === 'hi' && festival.description_hi ? festival.description_hi :
                     language === 'ta' && festival.description_ta ? festival.description_ta :
                     festival.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <CalendarDaysIcon className="w-4 h-4 inline mr-1" />
                      {new Date(festival.date).toLocaleDateString()}
                    </div>
                    <div className="text-sm font-medium bg-white bg-opacity-20 px-2 py-1 rounded">
                      {countdown ? (
                        countdown.days > 0 ? (
                          `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m`
                        ) : countdown.hours > 0 ? (
                          `${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`
                        ) : (
                          `${countdown.minutes}m ${countdown.seconds}s`
                        )
                      ) : daysUntil > 0 ? `${daysUntil} days` : 'Today'}
                    </div>
                  </div>
                </div>

                {/* Festival Info */}
                <div className="p-6">
                  {/* Typical Expenses */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Typical Expenses</h4>
                    <div className="flex flex-wrap gap-2">
                      {festival.typical_expenses.map(expense => (
                        <span 
                          key={expense}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {t('festivals', `categories.${expense.toLowerCase()}`) || expense}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Budget Suggestions */}
                  {festival.budget_suggestions && Object.keys(festival.budget_suggestions).length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Budget Suggestions</h4>
                      <div className="space-y-1 text-sm">
                        {Object.entries(festival.budget_suggestions).slice(0, 3).map(([category, amount]) => (
                          <div key={category} className="flex justify-between">
                            <span className="text-gray-600 capitalize">
                              {t('festivals', `categories.${category.toLowerCase()}`) || category}
                            </span>
                            <span className="font-medium text-emerald-600">
                              {formatCurrency(amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={() => openCreateBudget(festival)}
                    disabled={hasExistingBudget}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
                      hasExistingBudget
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    }`}
                  >
                    {hasExistingBudget ? (
                      <>
                        <SparklesIcon className="w-5 h-5" />
                        Budget Created
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-5 h-5" />
                        {t('festivals', 'create_budget')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Budget Modal */}
      {showCreateBudget && selectedFestival && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Create Budget for {selectedFestival.name}
                </h2>
                <button
                  onClick={() => setShowCreateBudget(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateBudget} className="space-y-6">
                {/* Total Budget */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('festivals', 'total_budget')}
                  </label>
                  <div className="relative">
                    <CurrencyRupeeIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="number"
                      value={budgetForm.total_budget}
                      onChange={(e) => setBudgetForm(prev => ({ ...prev, total_budget: e.target.value }))}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Enter total budget"
                      required
                    />
                  </div>
                </div>

                {/* Category-wise Budget */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Category-wise Allocation</h3>
                  <div className="space-y-3">
                    {selectedFestival.typical_expenses.map(category => (
                      <div key={category} className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 capitalize">
                          {t('festivals', `categories.${category.toLowerCase()}`) || category}
                        </label>
                        <div className="w-32">
                          <input
                            type="number"
                            value={budgetForm.allocated_budgets[category] || ''}
                            onChange={(e) => updateCategoryBudget(category, e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="₹0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateBudget(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg"
                  >
                    Create Budget
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {festivals.length === 0 && (
        <div className="text-center py-12">
          <GiftIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No upcoming festivals found</p>
        </div>
      )}
    </div>
  );
};

export default Festivals;
