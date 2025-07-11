import React, { useState } from 'react';
import { Bell, Clock, Tag, MapPin, X, Check, Trash2, Settings } from 'lucide-react';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Notification {
  id: string;
  type: 'deal' | 'expiring' | 'new' | 'location';
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: React.ReactNode;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'deal',
      title: 'Flash Deal Alert! 🔥',
      message: '70% off at The Rustic Table - Next 2 hours only!',
      time: '5 min ago',
      read: false,
      icon: <Tag className="w-5 h-5 text-orange-500" />
    },
    {
      id: '2',
      type: 'expiring',
      title: 'Deal Expiring Soon',
      message: 'Your saved deal at Sakura Sushi expires in 1 hour',
      time: '1 hour ago',
      read: false,
      icon: <Clock className="w-5 h-5 text-yellow-500" />
    },
    {
      id: '3',
      type: 'new',
      title: 'New Restaurant Added',
      message: 'Bella Italia just joined with exclusive deals',
      time: '3 hours ago',
      read: true,
      icon: <Bell className="w-5 h-5 text-blue-500" />
    },
    {
      id: '4',
      type: 'location',
      title: 'Deals Near You',
      message: '5 new deals available in your area',
      time: 'Yesterday',
      read: true,
      icon: <MapPin className="w-5 h-5 text-green-500" />
    }
  ]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-end p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md h-[90vh] shadow-2xl animate-in slide-in-from-right-4 duration-500 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bell className="w-6 h-6 text-gray-900 dark:text-gray-100" />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center space-x-1"
            >
              <Check className="w-4 h-4" />
              <span>Mark all as read</span>
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearAll}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <Bell className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-center">
                You're all caught up!<br />
                No new notifications.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {notification.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            !notification.read 
                              ? 'text-gray-900 dark:text-gray-100' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            {notification.time}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="ml-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button className="w-full btn-primary text-sm">
            Notification Settings
          </button>
        </div>
      </div>
    </div>
  );
};
