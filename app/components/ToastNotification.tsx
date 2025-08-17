"use client";

import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../src/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { notificationSound } from '../utils/sound';

interface ToastNotification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'pod_interest' | 'message' | 'pod_invite' | 'dna_match' | 'admin_action' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
  actionUserId?: string;
  actionUserName?: string;
  actionUserAvatar?: string;
  postId?: string;
  podId?: string;
}

interface ToastItem extends ToastNotification {
  isVisible: boolean;
  timeoutId?: NodeJS.Timeout;
}

export default function ToastNotificationSystem() {
  const [user] = useAuthState(auth);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [lastNotificationTime, setLastNotificationTime] = useState<Date>(new Date());

  useEffect(() => {
    if (!user) return;

    // Listen for new notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notification = { id: change.doc.id, ...change.doc.data() } as ToastNotification;
          const notificationTime = notification.createdAt?.toDate() || new Date();
          
          // Only show toast for notifications created after component mounted
          // and within the last 30 seconds to catch recent notifications
          const thirtySecondsAgo = new Date(Date.now() - 30000);
          if (notificationTime > lastNotificationTime && notificationTime > thirtySecondsAgo) {
            showToast(notification);
            // Play notification sound
            notificationSound.playNotification(notification.type);
          }
        }
      });
    }, (error) => {
      console.error('Error in toast notifications listener:', error);
      // Try fallback query without orderBy
      const fallbackQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        where('read', '==', false)
      );
      
      onSnapshot(fallbackQuery, (snapshot) => {
        console.log('Fallback toast query successful:', snapshot.docs.length, 'docs');
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notification = { id: change.doc.id, ...change.doc.data() } as ToastNotification;
            const notificationTime = notification.createdAt?.toDate() || new Date();
            const thirtySecondsAgo = new Date(Date.now() - 30000);
            
            if (notificationTime > lastNotificationTime && notificationTime > thirtySecondsAgo) {
              showToast(notification);
              notificationSound.playNotification(notification.type);
            }
          }
        });
      });
    });

    return () => unsubscribe();
  }, [user, lastNotificationTime]);

  const showToast = (notification: ToastNotification) => {
    const toastItem: ToastItem = {
      ...notification,
      isVisible: true,
    };

    setToasts(prev => [...prev, toastItem]);

    // Auto-hide toast after 5 seconds
    const timeoutId = setTimeout(() => {
      hideToast(notification.id);
    }, 5000);

    // Update the toast with timeout ID
    setToasts(prev => prev.map(toast => 
      toast.id === notification.id 
        ? { ...toast, timeoutId }
        : toast
    ));
  };

  const hideToast = (toastId: string) => {
    setToasts(prev => prev.map(toast => 
      toast.id === toastId 
        ? { ...toast, isVisible: false }
        : toast
    ));

    // Remove from array after animation
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== toastId));
    }, 300);
  };

  const handleToastClick = async (toast: ToastItem) => {
    // Mark as read
    try {
      await updateDoc(doc(db, 'notifications', toast.id), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }

    // Navigate based on notification type
    const handleNavigation = () => {
      switch (toast.type) {
        case 'message':
          window.location.href = '/chat';
          break;
        case 'like':
        case 'comment':
          if (toast.postId) {
            window.location.href = `/wall#post-${toast.postId}`;
          }
          break;
        case 'follow':
          if (toast.actionUserId) {
            window.location.href = `/user/${toast.actionUserId}`;
          }
          break;
        case 'pod_interest':
          if (toast.podId) {
            window.location.href = `/pods#pod-${toast.podId}`;
          }
          break;
        default:
          window.location.href = '/';
      }
    };

    hideToast(toast.id);
    setTimeout(handleNavigation, 100);
  };

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'follow': return '👥';
      case 'pod_interest': return '⚡';
      case 'message': return '💬';
      default: return '🔔';
    }
  };

  const getToastColor = (type: string) => {
    switch (type) {
      case 'like': return 'from-red-500 to-pink-500';
      case 'comment': return 'from-blue-500 to-indigo-500';
      case 'follow': return 'from-green-500 to-emerald-500';
      case 'pod_interest': return 'from-yellow-500 to-orange-500';
      case 'message': return 'from-purple-500 to-blue-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (!user || toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`transform transition-all duration-300 ease-out pointer-events-auto ${
            toast.isVisible 
              ? 'translate-x-0 opacity-100 scale-100' 
              : 'translate-x-full opacity-0 scale-95'
          }`}
        >
          <div
            onClick={() => handleToastClick(toast)}
            className={`bg-gradient-to-r ${getToastColor(toast.type)} text-white px-4 py-3 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-200 max-w-sm`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg backdrop-blur-sm">
                  {toast.actionUserAvatar && toast.type !== 'message' ? (
                    <span className="text-white font-bold text-sm">
                      {toast.actionUserAvatar}
                    </span>
                  ) : (
                    getToastIcon(toast.type)
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-sm truncate">
                    {toast.actionUserName && toast.type !== 'message' 
                      ? `${toast.actionUserName} ${toast.title.toLowerCase()}`
                      : toast.title
                    }
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      hideToast(toast.id);
                    }}
                    className="text-white/70 hover:text-white text-lg leading-none ml-2"
                  >
                    ×
                  </button>
                </div>
                <p className="text-white/90 text-xs leading-relaxed line-clamp-2">
                  {toast.message}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-white/60 text-xs">
                    {toast.createdAt?.toDate?.() 
                      ? formatTimeAgo(toast.createdAt.toDate())
                      : 'now'
                    }
                  </span>
                  <span className="text-white/60 text-xs">
                    Tap to view
                  </span>
                </div>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-lg overflow-hidden">
              <div 
                className="h-full bg-white/40 animate-shrink-width"
                style={{ animationDuration: '5s' }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
}
