import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth, formatCurrency } from '../App';
import { 
  CameraIcon,
  PencilIcon,
  MapPinIcon,
  ClockIcon,
  AcademicCapIcon,
  UserIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    skills: user?.skills?.join(', ') || '',
    availability_hours: user?.availability_hours || 10,
    location: user?.location || '',
    bio: user?.bio || '',
    student_level: user?.student_level || 'undergraduate'
  });
  
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        ...formData,
        skills: formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill),
        availability_hours: parseInt(formData.availability_hours)
      };

      await axios.put(`${API}/user/profile`, updateData);
      
      // Fetch updated user data
      const response = await axios.get(`${API}/user/profile`);
      updateUser(response.data);
      
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPhotoLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/user/profile/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Fetch updated user data
      const userResponse = await axios.get(`${API}/user/profile`);
      updateUser(userResponse.data);
      
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setPhotoLoading(false);
    }
  };

  const getStudentLevelDisplay = (level) => {
    const levels = {
      'high_school': 'High School',
      'undergraduate': 'Undergraduate',
      'graduate': 'Graduate'
    };
    return levels[level] || level;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 fade-in">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your personal information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Picture & Basic Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 slide-up">
            <div className="text-center">
              {/* Profile Photo */}
              <div className="relative inline-block mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                  {user?.profile_photo ? (
                    <img
                      src={`${BACKEND_URL}${user.profile_photo}`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-green-500">
                      <UserIcon className="w-16 h-16 text-white" />
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoLoading}
                  className="absolute bottom-0 right-0 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full shadow-lg transition-colors"
                >
                  {photoLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <CameraIcon className="w-5 h-5" />
                  )}
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2">{user?.full_name}</h2>
              <p className="text-gray-500 mb-4">{user?.email}</p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(user?.total_earnings || 0)}</p>
                  <p className="text-sm text-emerald-700">Total Earned</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{user?.current_streak || 0}</p>
                  <p className="text-sm text-purple-700">Day Streak</p>
                </div>
              </div>

              {/* Quick Info */}
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <AcademicCapIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">{getStudentLevelDisplay(user?.student_level)}</span>
                </div>
                
                {user?.location && (
                  <div className="flex items-center gap-3">
                    <MapPinIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">{user.location}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">{user?.availability_hours || 0} hours/week available</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
              <button
                onClick={() => setEditing(!editing)}
                className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <PencilIcon className="w-4 h-4" />
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {editing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      className="input-modern"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Student Level
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
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="input-modern"
                      placeholder="City, State"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Availability (hours/week)
                    </label>
                    <input
                      type="number"
                      name="availability_hours"
                      value={formData.availability_hours}
                      onChange={handleChange}
                      className="input-modern"
                      min="1"
                      max="40"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    className="input-modern"
                    placeholder="e.g., Math, Hindi, English, Programming"
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
                    className="input-modern resize-none"
                    rows="4"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="spinner"></div>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Full Name</h4>
                    <p className="text-gray-900">{user?.full_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Student Level</h4>
                    <p className="text-gray-900">{getStudentLevelDisplay(user?.student_level)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Location</h4>
                    <p className="text-gray-900">{user?.location || 'Not provided'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Availability</h4>
                    <p className="text-gray-900">{user?.availability_hours || 0} hours per week</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {user?.skills && user.skills.length > 0 ? (
                      user.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500">No skills added yet</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Bio</h4>
                  <p className="text-gray-900">{user?.bio || 'No bio provided yet'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Achievements Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6 slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-4">
              <StarIcon className="w-6 h-6 text-yellow-500" />
              <h3 className="text-xl font-bold text-gray-900">Achievements</h3>
            </div>

            {user?.achievements && user.achievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.achievements.map((achievement, index) => (
                  <div key={index} className="achievement-badge">
                    <StarIcon className="w-4 h-4" />
                    {achievement}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <StarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No achievements yet</p>
                <p className="text-sm text-gray-400">Keep earning to unlock achievements!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;