"use client";

import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../src/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  userId: string;
  type: 'pod_invite' | 'dna_match' | 'message' | 'admin_action' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
  data?: any;
}

export default function NotificationSystem() {
  const [user] = useAuthState(auth);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Listen to notifications for current user
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(n => 
          updateDoc(doc(db, 'notifications', n.id), { read: true })
        )
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'pod_invite': return '🚀';
      case 'dna_match': return '🧬';
      case 'message': return '💬';
      case 'admin_action': return '🛡️';
      case 'system': return '🔔';
      default: return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'pod_invite': return 'text-gold-950';
      case 'dna_match': return 'text-blue-400';
      case 'message': return 'text-green-400';
      case 'admin_action': return 'text-red-400';
      case 'system': return 'text-support';
      default: return 'text-support';
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-support hover:text-gold-950 transition-colors"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-midnight-900 rounded-lg shadow-xl border border-midnight-800 z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-midnight-800 flex items-center justify-between">
            <h3 className="font-semibold text-support">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-gold-950 hover:text-gold-900 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-support/60 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-midnight-800 hover:bg-midnight-800 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-midnight-800/50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <span className={`text-lg ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-support text-sm truncate">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-gold-950 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-support/80 text-xs mb-1">
                        {notification.message}
                      </p>
                      <span className="text-support/60 text-xs">
                        {notification.createdAt?.toDate ? 
                          notification.createdAt.toDate().toLocaleString() 
                          : 'now'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}

// Utility function to create notifications (can be used from other components)
export const createNotification = async (
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  data?: any
) => {
  try {
    const { addDoc, collection, Timestamp } = await import('firebase/firestore');
    await addDoc(collection(db, 'notifications'), {
      userId,
      type,
      title,
      message,
      data,
      read: false,
      createdAt: Timestamp.now(),
    });
    
    // Show toast notification
    toast.success(title, {
      duration: 4000,
      position: 'top-right',
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
