import React from 'react';
import { useAuth } from '../App';

const Footer = () => {
  const { user } = useAuth();

  // Don't show footer on login/register pages
  if (!user) return null;

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold mb-4">
              EarnNest<span className="text-sm align-super">®</span>
            </h3>
            <p className="text-gray-300 mb-6 max-w-md leading-relaxed">
              Empowering students and professionals to build financial success through smart money management, 
              personalized insights, and AI-powered side hustle opportunities. Your journey to financial independence starts here.
            </p>
            
            {/* Contact & Support */}
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-white mb-3">Contact & Support</h4>
              <div className="flex items-center space-x-2 text-gray-300">
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
                <a href="mailto:tortoor8@gmail.com" className="hover:text-emerald-400 transition-colors duration-200">
                  tortoor8@gmail.com
                </a>
              </div>
              <p className="text-sm text-gray-400">
                Available 24/7 for support and inquiries
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <a href="/dashboard" className="text-gray-300 hover:text-emerald-400 transition-colors duration-200 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-9 9a1 1 0 001.414 1.414L2 12.414V17a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1v-4.586l.293.293a1 1 0 001.414-1.414l-9-9z"/>
                  </svg>
                  Home
                </a>
              </li>
              <li>
                <a href="/analytics" className="text-gray-300 hover:text-emerald-400 transition-colors duration-200 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                  </svg>
                  Analytics
                </a>
              </li>
              <li>
                <a href="/hustles" className="text-gray-300 hover:text-emerald-400 transition-colors duration-200 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/>
                  </svg>
                  Services
                </a>
              </li>
              <li>
                <a href="/profile" className="text-gray-300 hover:text-emerald-400 transition-colors duration-200 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd"/>
                  </svg>
                  About
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <button className="text-gray-300 hover:text-emerald-400 transition-colors duration-200 text-left">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button className="text-gray-300 hover:text-emerald-400 transition-colors duration-200 text-left">
                  Terms of Service
                </button>
              </li>
              <li>
                <button className="text-gray-300 hover:text-emerald-400 transition-colors duration-200 text-left">
                  Cookie Policy
                </button>
              </li>
              <li>
                <button className="text-gray-300 hover:text-emerald-400 transition-colors duration-200 text-left">
                  Data Protection
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              <p>
                © {new Date().getFullYear()} EarnNest<span className="text-xs align-super">®</span>. 
                All rights reserved. Built with ❤️ for financial empowerment.
              </p>
            </div>
            
            {/* Social Links - Placeholder for future */}
            <div className="flex space-x-4">
              <div className="text-gray-500 text-sm">
                Follow us for updates
              </div>
              <div className="flex space-x-2">
                {/* Future social media icons */}
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
