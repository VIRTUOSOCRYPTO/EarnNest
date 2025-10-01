import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, formatCurrency } from '../App';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  StarIcon,
  TrophyIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FinancialGoals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '',
    category: 'custom',
    description: '',
    target_date: ''
  });

  const goalCategories = [
    { value: 'emergency_fund', label: 'Emergency Fund', icon: '🛡️', color: 'red' },
    { value: 'monthly_income', label: 'Monthly Income Goal', icon: '💰', color: 'green' },
    { value: 'graduation', label: 'Graduation Fund', icon: '🎓', color: 'blue' },
    { value: 'custom', label: 'Custom Goal', icon: '🎯', color: 'purple' }
  ];

  useEffect(() => {
    loadGoals();
  }, []);

  // Manage body scroll when modal is open
  useEffect(() => {
    if (showForm) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showForm]);

  const loadGoals = async () => {
    try {
      const response = await axios.get(`${API}/financial-goals`);
      setGoals(response.data);
    } catch (error) {
      console.error('Error loading goals:', error);
      setError('Failed to load financial goals');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount) || 0,
        target_date: formData.target_date ? new Date(formData.target_date).toISOString() : null
      };

      if (editingGoal) {
        await axios.put(`${API}/financial-goals/${editingGoal.id}`, submitData);
      } else {
        await axios.post(`${API}/financial-goals`, submitData);
      }

      await loadGoals();
      resetForm();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to save goal');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      target_amount: goal.target_amount.toString(),
      current_amount: goal.current_amount.toString(),
      category: goal.category,
      description: goal.description || '',
      target_date: goal.target_date ? new Date(goal.target_date).toISOString().split('T')[0] : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (goalId) => {
    try {
      // Use window.confirm to ensure compatibility
      const confirmDelete = window.confirm('Are you sure you want to delete this goal?');
      if (!confirmDelete) return;

      console.log('Deleting goal with ID:', goalId);
      const response = await axios.delete(`${API}/financial-goals/${goalId}`);
      console.log('Delete response:', response);
      
      await loadGoals();
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to delete goal';
      setError(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      target_amount: '',
      current_amount: '',
      category: 'custom',
      description: '',
      target_date: ''
    });
    setShowForm(false);
    setEditingGoal(null);
    setError('');
  };

  const getProgressPercentage = (current, target) => {
    return Math.min(100, (current / target) * 100);
  };

  const getCategoryInfo = (category) => {
    return goalCategories.find(cat => cat.value === category) || goalCategories[3];
  };

  if (loading && goals.length === 0) {
    return (
      <div className="responsive-container py-6 sm:py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="responsive-grid cols-1 cols-md-2 cols-lg-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="responsive-container py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8 fade-in">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
            <StarIcon className="w-8 h-8 mr-3 text-emerald-600" />
            Financial Goals
          </h1>
          <p className="text-gray-600 mt-1">Set and track your financial objectives</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary icon-text-center w-full sm:w-auto flex-shrink-0"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Goal</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="text-center py-12">
          <StarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">No Financial Goals Yet</h3>
          <p className="text-gray-400 mb-6">Start by setting your first financial goal to track your progress</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors shadow-lg"
          >
            <PlusIcon className="w-5 h-5" />
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="responsive-grid cols-1 cols-md-2 cols-lg-3">
          {goals.map((goal, index) => {
            const categoryInfo = getCategoryInfo(goal.category);
            const progress = getProgressPercentage(goal.current_amount, goal.target_amount);
            const isCompleted = progress >= 100;

            return (
              <div
                key={goal.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Goal Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-${categoryInfo.color}-50`}>
                      <span className="text-lg">{categoryInfo.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{goal.name}</h3>
                      <p className="text-sm text-gray-500">{categoryInfo.label}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    {isCompleted && (
                      <TrophyIcon className="w-5 h-5 text-yellow-500" />
                    )}
                    <button
                      onClick={() => handleEdit(goal)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className={`text-sm font-medium ${isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isCompleted ? 'bg-green-500' : `bg-${categoryInfo.color}-500`
                      }`}
                      style={{ width: `${Math.min(100, progress)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Amount Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current</span>
                    <span className="font-semibold text-emerald-600">
                      {formatCurrency(goal.current_amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Target</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(goal.target_amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Remaining</span>
                    <span className={`font-semibold ${
                      isCompleted ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {isCompleted ? 'Completed! 🎉' : formatCurrency(goal.target_amount - goal.current_amount)}
                    </span>
                  </div>
                </div>

                {/* Target Date */}
                {goal.target_date && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                  </div>
                )}

                {goal.description && (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">{goal.description}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingGoal ? 'Edit Goal' : 'Create New Goal'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Goal Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="input-modern"
                  required
                >
                  {goalCategories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Goal Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-modern"
                  placeholder="e.g., Emergency Fund"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Target Amount
                  </label>
                  <input
                    type="number"
                    name="target_amount"
                    value={formData.target_amount}
                    onChange={handleChange}
                    className="input-modern"
                    placeholder="₹50,000"
                    min="1"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Amount
                  </label>
                  <input
                    type="number"
                    name="current_amount"
                    value={formData.current_amount}
                    onChange={handleChange}
                    className="input-modern"
                    placeholder="₹0"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Target Date (Optional)
                </label>
                <input
                  type="date"
                  name="target_date"
                  value={formData.target_date}
                  onChange={handleChange}
                  className="input-modern"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input-modern"
                  rows="3"
                  placeholder="Describe your goal..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? (
                    <div className="spinner"></div>
                  ) : (
                    editingGoal ? 'Update Goal' : 'Create Goal'
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialGoals;
