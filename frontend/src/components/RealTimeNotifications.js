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
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className={`transform transition-all duration-300 ease-in-out ${
            index === 0 ? 'animate-slide-in-right' : ''
          }`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div
            className={`rounded-lg border p-4 shadow-lg backdrop-blur-sm ${getNotificationColors(
              notification.type
            )}`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {notification.title}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {notification.message}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {notification.timestamp.toLocaleTimeString()}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  onClick={() => removeNotification(notification.id)}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RealTimeNotifications;
