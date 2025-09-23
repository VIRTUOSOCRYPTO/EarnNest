import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatCurrency } from '../App';
import { 
  PlusIcon, 
  MinusIcon,
  BanknotesIcon, 
  ChartBarIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [editForm, setEditForm] = useState({ category: '', allocated_amount: '' });
  const [totalAllocation, setTotalAllocation] = useState('');
  
  // Default categories for students
  const defaultCategories = [
    'Food', 'Transportation', 'Books', 'Entertainment', 'Rent', 'Utilities', 
    'Movies', 'Shopping', 'Groceries', 'Subscriptions', 'Emergency Fund'
  ];

  const [allocations, setAllocations] = useState(
    defaultCategories.reduce((acc, category) => {
      acc[category] = '';
      return acc;
    }, {})
  );
  
  const [customCategories, setCustomCategories] = useState([]);
  const [newCustomCategory, setNewCustomCategory] = useState('');

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const response = await axios.get(`${API}/budgets`);
      setBudgets(response.data);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAllocationChange = (category, value) => {
    setAllocations(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const addCustomCategory = () => {
    if (newCustomCategory.trim() && !customCategories.includes(newCustomCategory.trim())) {
      const category = newCustomCategory.trim();
      setCustomCategories(prev => [...prev, category]);
      setAllocations(prev => ({
        ...prev,
        [category]: ''
      }));
      setNewCustomCategory('');
    }
  };

  const removeCustomCategory = (category) => {
    setCustomCategories(prev => prev.filter(c => c !== category));
    setAllocations(prev => {
      const newAllocations = { ...prev };
      delete newAllocations[category];
      return newAllocations;
    });
  };

  const calculateTotalAllocated = () => {
    return Object.values(allocations).reduce((total, amount) => {
      return total + (parseFloat(amount) || 0);
    }, 0);
  };

  const handleSubmitAllocation = async (e) => {
    e.preventDefault();
    
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const totalAllocated = calculateTotalAllocated();
    
    if (totalAllocation && parseFloat(totalAllocation) !== totalAllocated) {
      alert(`Total allocation (${formatCurrency(parseFloat(totalAllocation))}) doesn't match sum of categories (${formatCurrency(totalAllocated)})`);
      return;
    }

    try {
      const promises = [];
      
      // Create budget entries for each category with allocation
      Object.entries(allocations).forEach(([category, amount]) => {
        if (amount && parseFloat(amount) > 0) {
          promises.push(
            axios.post(`${API}/budgets`, {
              category,
              allocated_amount: parseFloat(amount),
              month: currentMonth
            })
          );
        }
      });

      await Promise.all(promises);
      
      // Reset form
      setShowAllocationForm(false);
      setTotalAllocation('');
      setAllocations(defaultCategories.reduce((acc, category) => {
        acc[category] = '';
        return acc;
      }, {}));
      setCustomCategories([]);
      
      // Refresh budgets
      fetchBudgets();
      
    } catch (error) {
      console.error('Error creating budget allocation:', error);
      alert('Error creating budget allocation. Please try again.');
    }
  };

  const deleteBudget = async (budgetId) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await axios.delete(`${API}/budgets/${budgetId}`);
        fetchBudgets();
      } catch (error) {
        console.error('Error deleting budget:', error);
      }
    }
  };

  const editBudget = (budget) => {
    setEditingBudget(budget.id);
    setEditForm({
      category: budget.category,
      allocated_amount: budget.allocated_amount.toString()
    });
  };

  const updateBudget = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/budgets/${editingBudget}`, {
        category: editForm.category,
        allocated_amount: parseFloat(editForm.allocated_amount)
      });
      
      setEditingBudget(null);
      setEditForm({ category: '', allocated_amount: '' });
      fetchBudgets();
    } catch (error) {
      console.error('Error updating budget:', error);
      alert('Error updating budget. Please try again.');
    }
  };

  const cancelEdit = () => {
    setEditingBudget(null);
    setEditForm({ category: '', allocated_amount: '' });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const allCategories = [...defaultCategories, ...customCategories];
  const totalAllocated = calculateTotalAllocated();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budget Allocation</h1>
          <p className="text-gray-600 mt-1">Allocate your money across different categories</p>
        </div>
        <button
          onClick={() => setShowAllocationForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          New Allocation
        </button>
      </div>

      {/* Multi-Category Allocation Modal */}
      {showAllocationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto slide-up">
            <h2 className="text-2xl font-bold mb-6">Multi-Category Budget Allocation</h2>
            
            <form onSubmit={handleSubmitAllocation} className="space-y-6">
              {/* Total Budget (Optional) */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Total Budget to Allocate (Optional)
                </label>
                <input
                  type="number"
                  value={totalAllocation}
                  onChange={(e) => setTotalAllocation(e.target.value)}
                  className="input-modern"
                  placeholder="Enter total amount to allocate"
                  step="0.01"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Leave empty to allocate any amounts. If specified, category totals must match.
                </p>
              </div>

              {/* Category Allocations */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allCategories.map((category) => (
                  <div key={category} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">
                        {category}
                      </label>
                      {customCategories.includes(category) && (
                        <button
                          type="button"
                          onClick={() => removeCustomCategory(category)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      value={allocations[category] || ''}
                      onChange={(e) => handleAllocationChange(category, e.target.value)}
                      className="input-modern"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                ))}
              </div>

              {/* Add Custom Category */}
              <div className="bg-green-50 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Add Custom Category
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCustomCategory}
                    onChange={(e) => setNewCustomCategory(e.target.value)}
                    className="input-modern flex-1"
                    placeholder="Enter custom category name"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCategory())}
                  />
                  <button
                    type="button"
                    onClick={addCustomCategory}
                    className="btn-secondary"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Allocation Summary */}
              <div className="bg-emerald-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Total Allocated:</span>
                  <span className="text-xl font-bold text-emerald-600">
                    {formatCurrency(totalAllocated)}
                  </span>
                </div>
                {totalAllocation && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">Target Budget:</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(parseFloat(totalAllocation) || 0)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAllocationForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={totalAllocated === 0}
                >
                  Allocate Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Current Budgets */}
      <div className="space-y-6">
        {budgets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget, index) => (
              <div
                key={budget.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {editingBudget === budget.id ? (
                  // Edit Form
                  <form onSubmit={updateBudget} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={editForm.category}
                        onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                        className="input-modern"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Allocated Amount
                      </label>
                      <input
                        type="number"
                        value={editForm.allocated_amount}
                        onChange={(e) => setEditForm({...editForm, allocated_amount: e.target.value})}
                        className="input-modern"
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="btn-primary flex-1 text-sm py-2"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="btn-secondary flex-1 text-sm py-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  // Display Mode
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900">{budget.category}</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => editBudget(budget)}
                          className="text-gray-500 hover:text-emerald-600 transition-colors"
                          title="Edit Budget"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteBudget(budget.id)}
                          className="text-gray-500 hover:text-red-600 transition-colors"
                          title="Delete Budget"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Allocated</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(budget.allocated_amount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Spent</span>
                          <span className="font-semibold text-red-500">{formatCurrency(budget.spent_amount)}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t pt-2">
                          <span className="font-medium text-gray-700">Remaining</span>
                          <span className={`font-bold ${budget.allocated_amount - budget.spent_amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {formatCurrency(budget.allocated_amount - budget.spent_amount)}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-300 ${
                            budget.spent_amount <= budget.allocated_amount 
                              ? 'bg-emerald-500' 
                              : 'bg-red-500'
                          }`}
                          style={{
                            width: `${Math.min((budget.spent_amount / budget.allocated_amount) * 100, 100)}%`
                          }}
                        ></div>
                      </div>

                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{budget.month}</span>
                        <span className="font-medium">
                          {Math.round((budget.spent_amount / budget.allocated_amount) * 100)}% used
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 slide-up">
            <BanknotesIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-500 mb-2">No budget allocations yet</h3>
            <p className="text-gray-400 mb-6">Start by creating your first budget allocation to track your spending</p>
            <button
              onClick={() => setShowAllocationForm(true)}
              className="btn-primary"
            >
              Create Your First Budget
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Budget;
