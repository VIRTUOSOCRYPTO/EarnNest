import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: '', // MANDATORY - will be required
    student_level: 'undergraduate',
    skills: '',
    availability_hours: 10,
    location: '', // MANDATORY - will be required
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    strength: 'Very Weak',
    color: 'red',
    feedback: []
  });
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  
  const { login } = useAuth();

  // Password strength checking
  useEffect(() => {
    if (formData.password) {
      checkPasswordStrength(formData.password);
    }
  }, [formData.password]);

  // Password match checking
  useEffect(() => {
    if (formData.confirmPassword) {
      setPasswordsMatch(formData.password === formData.confirmPassword);
    }
  }, [formData.password, formData.confirmPassword]);

  const checkPasswordStrength = async (password) => {
    try {
      const response = await axios.post(`${API}/auth/password-strength`, { password });
      setPasswordStrength(response.data);
    } catch (error) {
      // Fallback to basic client-side checking
      const score = getPasswordScore(password);
      setPasswordStrength({
        score,
        strength: getStrengthText(score),
        color: getStrengthColor(score),
        feedback: getPasswordFeedback(password)
      });
    }
  };

  const getPasswordScore = (password) => {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 25;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;
    return Math.min(100, score);
  };

  const getStrengthText = (score) => {
    if (score >= 80) return 'Very Strong';
    if (score >= 60) return 'Strong';
    if (score >= 40) return 'Medium';
    if (score >= 20) return 'Weak';
    return 'Very Weak';
  };

  const getStrengthColor = (score) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'blue';
    if (score >= 40) return 'yellow';
    if (score >= 20) return 'orange';
    return 'red';
  };

  const getPasswordFeedback = (password) => {
    const feedback = [];
    if (password.length < 8) feedback.push('Use at least 8 characters');
    if (!/[A-Z]/.test(password)) feedback.push('Add uppercase letters');
    if (!/[a-z]/.test(password)) feedback.push('Add lowercase letters');
    if (!/\d/.test(password)) feedback.push('Add numbers');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) feedback.push('Add special characters');
    return feedback;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (passwordStrength.score < 40) {
      setError('Password is too weak. Please choose a stronger password.');
      return false;
    }

    if (formData.full_name.trim().length < 2) {
      setError('Full name must be at least 2 characters long');
      return false;
    }

    // Mandatory role validation
    if (!formData.role || !formData.role.trim()) {
      setError('Role selection is required');
      return false;
    }

    // Mandatory location validation  
    if (!formData.location || !formData.location.trim()) {
      setError('Location is required and cannot be empty');
      return false;
    }

    if (formData.location.trim().length < 3) {
      setError('Location must be at least 3 characters long');
      return false;
    }

    // Basic location format validation
    const location = formData.location.trim();
    if (!location.includes(',') && location.split(' ').length < 2) {
      setError('Location should include city and state/country (e.g., "Mumbai, Maharashtra" or "New York, USA")');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        skills: formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill),
        availability_hours: parseInt(formData.availability_hours)
      };
      delete submitData.confirmPassword;

      const response = await axios.post(`${API}/auth/register`, submitData);
      
      // Direct login after registration - no email verification needed
      login(response.data.user, response.data.token);
      navigate('/dashboard');
    } catch (error) {
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          setError(error.response.data.detail[0].msg || 'Registration failed');
        } else {
          setError(error.response.data.detail);
        }
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color) => {
    const colorMap = {
      red: 'bg-red-500 text-red-700 border-red-300',
      orange: 'bg-orange-500 text-orange-700 border-orange-300',
      yellow: 'bg-yellow-500 text-yellow-700 border-yellow-300',
      blue: 'bg-blue-500 text-blue-700 border-blue-300',
      green: 'bg-green-500 text-green-700 border-green-300'
    };
    return colorMap[color] || colorMap.red;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        <div className="form-container fade-in">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">₹</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Join EarnWise</h1>
            <p className="text-gray-600">Start your journey to financial success</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="input-modern"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-modern"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input-modern pr-12"
                    placeholder="Create a strong password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                {/* Password Strength Meter */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Password Strength</span>
                      <span className={`text-sm font-semibold ${passwordStrength.color === 'green' ? 'text-green-600' : 
                        passwordStrength.color === 'blue' ? 'text-blue-600' :
                        passwordStrength.color === 'yellow' ? 'text-yellow-600' :
                        passwordStrength.color === 'orange' ? 'text-orange-600' : 'text-red-600'}`}>
                        {passwordStrength.strength} ({passwordStrength.score}/100)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.color === 'green' ? 'bg-green-500' :
                          passwordStrength.color === 'blue' ? 'bg-blue-500' :
                          passwordStrength.color === 'yellow' ? 'bg-yellow-500' :
                          passwordStrength.color === 'orange' ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${passwordStrength.score}%` }}
                      ></div>
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <p className="mb-1">Suggestions:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {passwordStrength.feedback.map((feedback, index) => (
                            <li key={index}>{feedback}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`input-modern pr-12 ${
                      formData.confirmPassword && !passwordsMatch 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : formData.confirmPassword && passwordsMatch 
                        ? 'border-green-300 focus:border-green-500 focus:ring-green-500' 
                        : ''
                    }`}
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                  {formData.confirmPassword && (
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                      {passwordsMatch ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {formData.confirmPassword && !passwordsMatch && (
                  <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="input-modern"
                  required
                >
                  <option value="">Select your role</option>
                  <option value="Student">Student</option>
                  <option value="Professional">Professional</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Student Level *
                </label>
                <select
                  name="student_level"
                  value={formData.student_level}
                  onChange={handleChange}
                  className="input-modern"
                  required
                >
                  <option value="high_school">High School</option>
                  <option value="undergraduate">Undergraduate</option>
                  <option value="graduate">Graduate</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Available Hours/Week
                </label>
                <input
                  type="number"
                  name="availability_hours"
                  value={formData.availability_hours}
                  onChange={handleChange}
                  className="input-modern"
                  min="1"
                  max="40"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="input-modern"
                  placeholder="e.g., Mumbai, Maharashtra"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Please include city and state/country
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Skills (comma separated)
              </label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                className="input-modern"
                placeholder="e.g., Python, Writing, Design, Tutoring"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="input-modern"
                rows="3"
                maxLength="500"
                placeholder="Tell us about yourself (optional)"
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {formData.bio.length}/500
              </div>
            </div>

            <button
              type="submit"
              disabled={
                loading || 
                !passwordsMatch || 
                passwordStrength.score < 40 || 
                !formData.role || 
                !formData.location.trim()
              }
              className="btn-primary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                'Create Account & Sign In'
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-600 font-semibold hover:text-emerald-700">
                Sign in here
              </Link>
            </p>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <ShieldCheckIcon className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Secure Registration</p>
                <p className="text-sm text-blue-700">
                  Your data is protected with advanced security measures. Start earning immediately after registration!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
