import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { 
  XMarkIcon, 
  TrophyIcon, 
  CalendarDaysIcon, 
  ExclamationCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  GiftIcon
} from '@heroicons/react/24/outline';

const RealTimeNotifications = () => {
  const { notifications, removeNotification } = useWebSocket();
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  useEffect(() => {
    setVisibleNotifications(notifications);
  }, [notifications]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'achievement':
        return <TrophyIcon className="w-6 h-6 text-yellow-500" />;
      case 'festival':
        return <GiftIcon className="w-6 h-6 text-purple-500" />;
      case 'challenge':
        return <CalendarDaysIcon className="w-6 h-6 text-blue-500" />;
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'warning':
        return <ExclamationCircleIcon className="w-6 h-6 text-orange-500" />;
      case 'error':
        return <ExclamationCircleIcon className="w-6 h-6 text-red-500" />;
      default:
        return <InformationCircleIcon className="w-6 h-6 text-blue-500" />;
    }
  };

  const getNotificationColors = (type) => {
    switch (type) {
      case 'achievement':
        return 'bg-yellow-50 border-yellow-200 shadow-yellow-100';
      case 'festival':
        return 'bg-purple-50 border-purple-200 shadow-purple-100';
      case 'challenge':
        return 'bg-blue-50 border-blue-200 shadow-blue-100';
      case 'success':
        return 'bg-green-50 border-green-200 shadow-green-100';
      case 'warning':
        return 'bg-orange-50 border-orange-200 shadow-orange-100';
      case 'error':
        return 'bg-red-50 border-red-200 shadow-red-100';
      default:
        return 'bg-white border-gray-200 shadow-gray-100';
    }
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 max-w-sm">
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className={`transform transition-all duration-500 ease-out animate-notification-entry`}
          style={{ 
            animationDelay: `${index * 150}ms`,
            '--tw-translate-x': `${index * 2}px`
          }}
        >
          <div
            className={`rounded-xl border-2 p-4 shadow-2xl backdrop-blur-lg relative overflow-hidden ${getNotificationColors(
              notification.type
            )}`}
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
            
            {/* Content */}
            <div className="relative flex items-start">
              <div className="flex-shrink-0 relative">
                <div className="animate-bounce-in">
                  {getNotificationIcon(notification.type)}
                </div>
                {notification.type === 'achievement' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse-glow"></div>
                )}
              </div>
              
              <div className="ml-4 w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 tracking-wide">
                  {notification.title}
                </p>
                <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                  {notification.message}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500 font-medium">
                    {notification.timestamp.toLocaleTimeString()}
                  </p>
                  {/* Progress bar for auto-dismiss */}
                  <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full animate-progress"
                      style={{ animation: 'progress 5s linear' }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="ml-3 flex-shrink-0">
                <button
                  className="bg-white/80 backdrop-blur-sm rounded-lg inline-flex p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 transform hover:scale-110"
                  onClick={() => removeNotification(notification.id)}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Interactive elements for different notification types */}
            {notification.type === 'achievement' && (
              <div className="mt-3 flex items-center space-x-2">
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-semibold animate-pulse">
                  🎉 New Achievement!
                </span>
              </div>
            )}

            {notification.type === 'festival' && (
              <div className="mt-3 flex items-center space-x-2">
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-semibold animate-festival-countdown">
                  🎊 Festival Alert
                </span>
              </div>
            )}

            {notification.type === 'challenge' && (
              <div className="mt-3 flex items-center space-x-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-semibold">
                  🎯 Challenge Update
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RealTimeNotifications;
