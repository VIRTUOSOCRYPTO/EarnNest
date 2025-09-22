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
  const [formData, setFormData] = useState({
    type: 'income',
    amount: '',
    category: '',
    description: '',
    source: '',
    is_hustle_related: false
  });

  const incomeCategories = ['Salary', 'Freelance', 'Tutoring', 'Side Hustle', 'Scholarship', 'Other'];
  const expenseCategories = ['Food', 'Transportation', 'Books', 'Entertainment', 'Rent', 'Utilities', 'Other'];

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      await axios.post(`${API}/transactions`, submitData);
      setShowAddForm(false);
      setFormData({
        type: 'income',
        amount: '',
        category: '',
        description: '',
        source: '',
        is_hustle_related: false
      });
      fetchTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
          <div className="bg-white rounded-xl p-6 w-full max-w-md slide-up">
            <h2 className="text-2xl font-bold mb-6">Add New Transaction</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
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
                >
                  Add Transaction
                </button>
              </div>
            </form>
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