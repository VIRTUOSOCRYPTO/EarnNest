import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatCurrency } from '../App';
import { 
  PlusIcon, 
  BanknotesIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  CalendarIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [budgetWarning, setBudgetWarning] = useState('');
  const [budgetInfo, setBudgetInfo] = useState({});
  const [isMultiCategory, setIsMultiCategory] = useState(false);
  const [formData, setFormData] = useState({
    type: 'income',
    amount: '',
    category: '',
    description: '',
    source: '',
    is_hustle_related: false
  });
  
  // Multi-category form data
  const [multiCategoryData, setMultiCategoryData] = useState({
    type: 'expense',
    total_amount: '',
    description: '',
    categories: {}
  });

  const incomeCategories = ['Salary', 'Freelance', 'Tutoring', 'Side Hustle', 'Scholarship', 'Other'];
  const expenseCategories = [
    'Food', 'Transportation', 'Books', 'Entertainment', 'Rent', 'Utilities', 
    'Movies', 'Shopping', 'Groceries', 'Subscriptions', 'Emergency Fund', 'Other'
  ];

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API}/transactions?limit=100`);
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCategoryBudget = async (category) => {
    try {
      const response = await axios.get(`${API}/budgets/category/${category}`);
      setBudgetInfo(prev => ({
        ...prev,
        [category]: response.data
      }));
      return response.data;
    } catch (error) {
      console.error('Error checking budget:', error);
      return null;
    }
  };

  const validateExpenseBudget = async (category, amount) => {
    const budget = await checkCategoryBudget(category);
    if (!budget || !budget.has_budget) {
      return `No budget allocated for '${category}' category. Please allocate budget first.`;
    }
    
    if (amount > budget.remaining_amount) {
      return `No money, you reached the limit! Remaining budget for '${category}': ₹${budget.remaining_amount.toFixed(2)}, but you're trying to spend ₹${amount.toFixed(2)}`;
    }
    
    return null; // No error
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setBudgetWarning('');
    
    try {
      if (isMultiCategory) {
        // Handle multi-category transaction
        const totalCategoryAmount = Object.values(multiCategoryData.categories).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
        
        if (Math.abs(totalCategoryAmount - parseFloat(multiCategoryData.total_amount)) > 0.01) {
          setBudgetWarning(`Category amounts (${formatCurrency(totalCategoryAmount)}) don't match total amount (${formatCurrency(parseFloat(multiCategoryData.total_amount))})`);
          return;
        }

        // Validate budget for each expense category
        if (multiCategoryData.type === 'expense') {
          for (const [category, amount] of Object.entries(multiCategoryData.categories)) {
            if (amount && parseFloat(amount) > 0) {
              const error = await validateExpenseBudget(category, parseFloat(amount));
              if (error) {
                setBudgetWarning(error);
                return;
              }
            }
          }
        }

        // Create separate transactions for each category
        const promises = Object.entries(multiCategoryData.categories).map(([category, amount]) => {
          if (amount && parseFloat(amount) > 0) {
            return axios.post(`${API}/transactions`, {
              type: multiCategoryData.type,
              amount: parseFloat(amount),
              category: category,
              description: `${multiCategoryData.description} (Split transaction)`,
              source: '',
              is_hustle_related: false
            });
          }
        }).filter(Boolean);

        await Promise.all(promises);
        
        // Reset multi-category form
        setMultiCategoryData({
          type: 'expense',
          total_amount: '',
          description: '',
          categories: {}
        });
      } else {
        // Handle single transaction
        const submitData = {
          ...formData,
          amount: parseFloat(formData.amount)
        };

        // Validate budget for single expense
        if (formData.type === 'expense') {
          const error = await validateExpenseBudget(formData.category, parseFloat(formData.amount));
          if (error) {
            setBudgetWarning(error);
            return;
          }
        }

        await axios.post(`${API}/transactions`, submitData);
        
        // Reset single form
        setFormData({
          type: 'income',
          amount: '',
          category: '',
          description: '',
          source: '',
          is_hustle_related: false
        });
      }

      setShowAddForm(false);
      fetchTransactions();
      
    } catch (error) {
      console.error('Error creating transaction:', error);
      if (error.response?.data?.detail) {
        setBudgetWarning(error.response.data.detail);
      } else {
        setBudgetWarning('Failed to create transaction. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Check budget when expense category is selected
    if (name === 'category' && formData.type === 'expense' && value) {
      checkCategoryBudget(value);
    }
  };

  const handleMultiCategoryChange = (field, value) => {
    setMultiCategoryData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategoryAmountChange = (category, amount) => {
    setMultiCategoryData(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: amount
      }
    }));
  };

  const calculateMultiCategoryTotal = () => {
    return Object.values(multiCategoryData.categories).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupTransactionsByDate = (transactions) => {
    const groups = {};
    transactions.forEach(transaction => {
      const date = new Date(transaction.date).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const groupedTransactions = groupTransactionsByDate(transactions);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-1">Track your income and expenses</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Add Transaction
        </button>
      </div>

      {/* Add Transaction Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Add New Transaction</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMultiCategory(!isMultiCategory)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    isMultiCategory 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {isMultiCategory ? 'Multi-Category' : 'Single Category'}
                </button>
              </div>
            </div>
            
            {isMultiCategory ? (
              /* Multi-Category Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 mb-2">
                    Split a single expense across multiple categories
                  </p>
                </div>

                {budgetWarning && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <p className="text-sm text-red-700">{budgetWarning}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Total Amount
                    </label>
                    <input
                      type="number"
                      value={multiCategoryData.total_amount}
                      onChange={(e) => handleMultiCategoryChange('total_amount', e.target.value)}
                      className="input-modern"
                      placeholder="0.00"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={multiCategoryData.description}
                      onChange={(e) => handleMultiCategoryChange('description', e.target.value)}
                      className="input-modern"
                      placeholder="Brief description"
                      required
                    />
                  </div>
                </div>

                {/* Category Amount Grid */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    Category Breakdown
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {expenseCategories.map(category => (
                      <div key={category} className="bg-gray-50 p-3 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {category}
                        </label>
                        <input
                          type="number"
                          value={multiCategoryData.categories[category] || ''}
                          onChange={(e) => handleCategoryAmountChange(category, e.target.value)}
                          className="input-modern"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-semibold ml-2">
                        {formatCurrency(parseFloat(multiCategoryData.total_amount) || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Categories Total:</span>
                      <span className={`font-semibold ml-2 ${
                        Math.abs(calculateMultiCategoryTotal() - (parseFloat(multiCategoryData.total_amount) || 0)) < 0.01
                          ? 'text-emerald-600' 
                          : 'text-red-500'
                      }`}>
                        {formatCurrency(calculateMultiCategoryTotal())}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setIsMultiCategory(false);
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={submitting || Math.abs(calculateMultiCategoryTotal() - (parseFloat(multiCategoryData.total_amount) || 0)) > 0.01}
                  >
                    {submitting ? 'Adding...' : 'Add Multi-Category Transaction'}
                  </button>
                </div>
              </form>
            ) : (
              /* Single Transaction Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {budgetWarning && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <p className="text-sm text-red-700">{budgetWarning}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="input-modern"
                    required
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="input-modern"
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="input-modern"
                    required
                  >
                    <option value="">Select category</option>
                    {(formData.type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  
                  {/* Budget Information Display */}
                  {formData.type === 'expense' && formData.category && budgetInfo[formData.category] && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-xs font-semibold text-blue-800 mb-1">Budget Status for {formData.category}</div>
                      {budgetInfo[formData.category].has_budget ? (
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Allocated:</span>
                            <div className="font-medium">{formatCurrency(budgetInfo[formData.category].allocated_amount)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Spent:</span>
                            <div className="font-medium text-red-600">{formatCurrency(budgetInfo[formData.category].spent_amount)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Remaining:</span>
                            <div className={`font-medium ${budgetInfo[formData.category].remaining_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(budgetInfo[formData.category].remaining_amount)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-orange-600">
                          No budget allocated for this category. Please allocate budget first.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="input-modern"
                    placeholder="Brief description"
                    required
                  />
                </div>

                {formData.type === 'income' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Source (Optional)
                    </label>
                    <input
                      type="text"
                      name="source"
                      value={formData.source}
                      onChange={handleChange}
                      className="input-modern"
                      placeholder="e.g., Upwork, Company Name"
                    />
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_hustle_related"
                    checked={formData.is_hustle_related}
                    onChange={handleChange}
                    className="w-4 h-4 text-emerald-600 rounded mr-2"
                  />
                  <label className="text-sm text-gray-700">
                    This is related to a side hustle
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={submitting}
                  >
                    {submitting ? 'Adding...' : 'Add Transaction'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="space-y-6">
        {Object.keys(groupedTransactions).length > 0 ? (
          Object.entries(groupedTransactions)
            .sort(([a], [b]) => new Date(b) - new Date(a))
            .map(([date, dayTransactions]) => (
              <div key={date} className="slide-up">
                <div className="flex items-center gap-3 mb-3">
                  <CalendarIcon className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-700">
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                </div>
                
                <div className="space-y-2">
                  {dayTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`transaction-item card-hover ${
                        transaction.type === 'income' ? 'transaction-income' : 'transaction-expense'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${
                            transaction.type === 'income' 
                              ? 'bg-emerald-100' 
                              : 'bg-red-100'
                          }`}>
                            {transaction.type === 'income' ? (
                              <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <ArrowTrendingDownIcon className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-900">{transaction.description}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-1">
                                <TagIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-500">{transaction.category}</span>
                              </div>
                              
                              {transaction.source && (
                                <span className="text-sm text-gray-500">
                                  • {transaction.source}
                                </span>
                              )}
                              
                              {transaction.is_hustle_related && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                  Side Hustle
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className={`font-bold text-lg ${
                            transaction.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(transaction.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
        ) : (
          <div className="text-center py-12 slide-up">
            <BanknotesIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-500 mb-2">No transactions yet</h3>
            <p className="text-gray-400 mb-6">Start tracking your income and expenses to see them here</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              Add Your First Transaction
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
