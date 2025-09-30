import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import LanguageSelector from './LanguageSelector';
import { 
  HomeIcon, 
  CreditCardIcon,
  BanknotesIcon,
  BriefcaseIcon, 
  ChartBarIcon, 
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  StarIcon,
  LightBulbIcon,
  GiftIcon,
  TrophyIcon,
  UsersIcon,
  CalendarDaysIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { formatCurrency } from '../App';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/transactions', label: 'Transactions', icon: CreditCardIcon },
    { path: '/budget', label: 'Budget', icon: BanknotesIcon },
    { path: '/goals', label: 'Goals', icon: StarIcon },
    { path: '/hustles', label: 'Side Hustles', icon: BriefcaseIcon },
    { path: '/analytics', label: 'Analytics', icon: ChartBarIcon },
    { path: '/recommendations', label: 'Recommendations', icon: LightBulbIcon },
    { path: '/referrals', label: 'Referrals', icon: UsersIcon },
    { path: '/achievements', label: 'Achievements', icon: TrophyIcon },
    { path: '/festivals', label: 'Festivals', icon: GiftIcon },
    { path: '/challenges', label: 'Challenges', icon: CalendarDaysIcon },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Mobile Hamburger Menu */}
            <div className="lg:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>

            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">₹</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-bold gradient-text truncate">EarnNest</h1>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                        : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden xl:inline">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right Side Menu */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                  <BellIcon className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
                  )}
                </button>
              </div>

              {/* Language Selector */}
              <div className="hidden md:block">
                <LanguageSelector />
              </div>
              
              {/* EarnCoins Balance */}
              <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-3 py-2 rounded-lg">
                <span className="text-sm font-medium">💰 {user?.earn_coins_balance || 0}</span>
              </div>

              {/* Desktop Profile */}
              <div className="hidden md:flex items-center space-x-3">
                <Link to="/profile" className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors max-w-48">
                  {user?.profile_photo ? (
                    <img 
                      src={`${process.env.REACT_APP_BACKEND_URL}${user.profile_photo}`}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <UserCircleIcon className="w-8 h-8 text-gray-400 flex-shrink-0" />
                  )}
                  <div className="text-sm min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{user?.full_name}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">{formatCurrency(user?.total_earnings || 0)}</span>
                      <span className="text-orange-600">🔥{user?.daily_login_streak || 0}</span>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Mobile Profile */}
              <div className="md:hidden">
                <Link to="/profile" className="flex items-center hover:bg-gray-50 rounded-lg p-2 transition-colors">
                  {user?.profile_photo ? (
                    <img 
                      src={`${process.env.REACT_APP_BACKEND_URL}${user.profile_photo}`}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="w-8 h-8 text-gray-400" />
                  )}
                </Link>
              </div>
              
              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-2 sm:px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span className="hidden lg:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Slide-out Menu */}
      <div className={`fixed inset-0 z-50 lg:hidden ${isMenuOpen ? '' : 'pointer-events-none'}`}>
        {/* Background overlay */}
        <div
          className={`fixed inset-0 bg-black transition-opacity duration-300 ease-linear ${
            isMenuOpen ? 'opacity-25' : 'opacity-0'
          }`}
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Slide-out menu */}
        <div
          className={`fixed top-0 left-0 z-40 w-64 h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">₹</span>
              </div>
              <h1 className="text-xl font-bold gradient-text">EarnNest</h1>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              {user?.profile_photo ? (
                <img 
                  src={`${process.env.REACT_APP_BACKEND_URL}${user.profile_photo}`}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <UserCircleIcon className="w-10 h-10 text-gray-400" />
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{formatCurrency(user?.total_earnings || 0)} earned</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-3 py-1 rounded-full text-xs">
                💰 {user?.earn_coins_balance || 0} Coins
              </div>
              <div className="text-xs text-orange-600 font-medium">
                🔥 {user?.daily_login_streak || 0} streak
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="mt-4 px-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  {item.label}
                  {isActive && <span className="ml-auto w-2 h-2 bg-emerald-500 rounded-full"></span>}
                </Link>
              );
            })}
          </nav>

          {/* Language Selector in Mobile Menu */}
          <div className="mt-6 px-4 border-t border-gray-200 pt-4">
            <LanguageSelector />
          </div>

          {/* Logout Button */}
          <div className="mt-4 px-2">
            <button
              onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;
