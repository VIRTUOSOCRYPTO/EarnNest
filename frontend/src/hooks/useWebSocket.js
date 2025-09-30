import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const useWebSocket = () => {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [realTimeData, setRealTimeData] = useState({
    achievements: [],
    challenges: [],
    festivals: [],
    leaderboard: []
  });
  
  const ws = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;
  const reconnectAttempts = useRef(0);

  const connect = () => {
    if (!user || !token) return;

    try {
      // Create WebSocket connection with authentication
      const wsUrl = `${BACKEND_URL.replace('http', 'ws')}/ws?token=${token}`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Send initial subscription message
        ws.current.send(JSON.stringify({
          type: 'subscribe',
          channels: ['achievements', 'challenges', 'festivals', 'notifications', 'leaderboard']
        }));
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`🔄 Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
            connect();
          }, delay);
        }
      };

      ws.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'achievement_unlocked':
        setRealTimeData(prev => ({
          ...prev,
          achievements: [...prev.achievements, data.achievement]
        }));
        
        // Add notification
        addNotification({
          id: Date.now(),
          type: 'achievement',
          title: '🏆 Achievement Unlocked!',
          message: data.achievement.name,
          timestamp: new Date(),
          data: data.achievement
        });
        break;

      case 'challenge_update':
        setRealTimeData(prev => ({
          ...prev,
          challenges: prev.challenges.map(challenge => 
            challenge.id === data.challenge.id ? data.challenge : challenge
          )
        }));
        break;

      case 'festival_reminder':
        addNotification({
          id: Date.now(),
          type: 'festival',
          title: '🎊 Festival Reminder',
          message: `${data.festival.name} is in ${data.days_remaining} days!`,
          timestamp: new Date(),
          data: data.festival
        });
        break;

      case 'leaderboard_update':
        setRealTimeData(prev => ({
          ...prev,
          leaderboard: data.leaderboard
        }));
        break;

      case 'progress_update':
        // Handle real-time progress updates
        if (data.achievement_id) {
          setRealTimeData(prev => ({
            ...prev,
            achievements: prev.achievements.map(achievement =>
              achievement.id === data.achievement_id
                ? { ...achievement, progress: data.progress }
                : achievement
            )
          }));
        }
        break;

      case 'notification':
        addNotification({
          id: Date.now(),
          type: data.category || 'info',
          title: data.title,
          message: data.message,
          timestamp: new Date(),
          data: data.payload
        });
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 10)); // Keep only 10 recent notifications
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const sendMessage = (message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (ws.current) {
      ws.current.close(1000, 'User disconnected');
    }
  };

  // Connect when user is authenticated
  useEffect(() => {
    if (user && token) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [user, token]);

  return {
    isConnected,
    notifications,
    realTimeData,
    sendMessage,
    removeNotification,
    disconnect
  };
};

export default useWebSocket;
