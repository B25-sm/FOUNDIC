"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../src/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, doc, getDoc, Timestamp, getDocs, updateDoc } from 'firebase/firestore';
import UserDropdown from './UserDropdown';
import { useMessageCount } from '../hooks/useMessageCount';

interface Chat {
  id: string;
  participants: string[];
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    timestamp: any;
    read: boolean;
  };
  lastMessageTime?: any;
  lastMessageSender?: string;
  participantDetails?: {
    [key: string]: {
      name: string;
      role: string;
      avatar: string;
    };
  };
  unreadCount?: number;
}

interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'pod_interest' | 'message';
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

export default function Navbar() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showMessages, setShowMessages] = useState(false);
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [newMessageNotification, setNewMessageNotification] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { lastSeenMessageTime, updateLastSeenMessageTime } = useMessageCount(user?.uid);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Hide suggestions and navigate to search results page
    setShowSearchSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  // Fetch search suggestions
  const fetchSearchSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
      return;
    }

    try {
      const suggestions: any[] = [];
      const queryLower = query.toLowerCase();

      // Get recent users (limit to 5)
      const usersQuery = collection(db, 'users');
      const usersSnapshot = await getDocs(usersQuery);
      
      usersSnapshot.docs.forEach((doc) => {
        const userData = doc.data();
        const displayName = userData.displayName || '';
        const email = userData.email || '';
        const role = userData.role || '';
        
        // Better data validation and filtering
        if (
          suggestions.length < 5 &&
          (displayName.toLowerCase().includes(queryLower) ||
           email.toLowerCase().includes(queryLower) ||
           role.toLowerCase().includes(queryLower))
        ) {
          // Clean and validate the data
          const cleanDisplayName = displayName || email?.split('@')[0] || 'User';
          const cleanRole = role || 'Member';
          const cleanAvatar = displayName?.[0]?.toUpperCase() || email?.[0]?.toUpperCase() || 'U';
          
          suggestions.push({
            id: doc.id,
            type: 'user',
            title: cleanDisplayName,
            subtitle: `${cleanRole}${userData.location ? ' • ' + userData.location : ''}`,
            avatar: cleanAvatar,
            profilePicture: userData.profilePicture || null
          });
        }
      });

      console.log('Search suggestions:', suggestions);
      setSearchSuggestions(suggestions);
      setShowSearchSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
    }
  };

  // Handle search input change with proper debouncing
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Clear suggestions if query is too short
    if (value.trim().length < 2) {
      setShowSearchSuggestions(false);
      setSearchSuggestions([]);
      return;
    }
    
    // Simple debounce - fetch suggestions immediately for now
    fetchSearchSuggestions(value);
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(notification =>
          updateDoc(doc(db, 'notifications', notification.id), { read: true })
        )
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Test function to create sample notifications (for demo purposes)
  const createTestNotifications = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/test-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });
      
      if (response.ok) {
        console.log('Test notifications created successfully');
      }
    } catch (error) {
      console.error('Error creating test notifications:', error);
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        // Ignore errors if audio can't play
      });
    }
  };

  // Fetch notifications
  useEffect(() => {
    if (!user) return;

    // Try with orderBy first
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      console.log('Notifications fetched:', notificationsData.length, 'docs');
      
      setNotifications(notificationsData);
      
      // Count unread notifications
      const unreadNotifications = notificationsData.filter(n => !n.read);
      setNotificationCount(unreadNotifications.length);
      
      console.log('Unread notifications count:', unreadNotifications.length);
      
      // Play sound for new notifications (only if there are new unread ones)
      if (unreadNotifications.length > 0 && notifications.length > 0) {
        playNotificationSound();
      }
    }, (error) => {
      console.error('Error fetching notifications with orderBy:', error);
      
      // Fallback query without orderBy
      const fallbackQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid)
      );
      
      onSnapshot(fallbackQuery, (snapshot) => {
        const notificationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notification[];
        
        // Sort manually by createdAt
        const sortedNotifications = notificationsData.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime.getTime() - aTime.getTime();
        }).slice(0, 20);
        
        console.log('Fallback notifications fetched:', sortedNotifications.length, 'docs');
        
        setNotifications(sortedNotifications);
        
        // Count unread notifications
        const unreadNotifications = sortedNotifications.filter(n => !n.read);
        setNotificationCount(unreadNotifications.length);
        
        console.log('Fallback unread notifications count:', unreadNotifications.length);
      }, (fallbackError) => {
        console.error('Fallback notifications query also failed:', fallbackError);
        setNotifications([]);
        setNotificationCount(0);
      });
    });

    return () => unsubscribeNotifications();
  }, [user]);

  // Fetch recent chats for messages dropdown
  useEffect(() => {
    if (!user) return;

    console.log('Starting to fetch chats for user:', user.uid);
    setLoading(true);
    
    // Use simple query without orderBy to avoid index issues
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
      console.log('Chats snapshot received, docs count:', snapshot.docs.length);
      try {
        const chatsData = await Promise.all(
          snapshot.docs.map(async (docSnapshot) => {
            const chatData = docSnapshot.data() as Chat;
            const chatId = docSnapshot.id;
            console.log('Processing chat:', chatId, 'participants:', chatData.participants);
            
            // Get participant details
            const participantDetails: { [key: string]: any } = {};
            for (const participantId of chatData.participants) {
              if (participantId !== user.uid) {
                try {
                  const userDocRef = doc(db, 'users', participantId);
                  const userDocSnap = await getDoc(userDocRef);
                  if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    
                    // Try multiple possible name fields with better fallback
                    const userName = userData.displayName || userData.name || userData.email?.split('@')[0] || `User-${participantId.slice(-4)}`;
                    const userAvatar = userData.avatar || userData.profilePicture || userName[0]?.toUpperCase() || 'U';
                    

                    
                    participantDetails[participantId] = {
                      name: userName,
                      role: userData.role || 'Member',
                      avatar: userAvatar
                    };
                    console.log(`Participant ${participantId} -> name: "${userName}"`);
                  }
                } catch (error) {
                  console.error('Error fetching user details for participant:', participantId, error);
                  // Try to get name from lastMessage sender name if available
                  const fallbackName = chatData.lastMessage?.senderName || `User-${participantId.slice(-4)}`;
                  participantDetails[participantId] = {
                    name: fallbackName,
                    role: 'Member',
                    avatar: fallbackName[0]?.toUpperCase() || 'U'
                  };
                }
              }
            }
            
            return {
              id: chatId,
              ...chatData,
              participantDetails
            };
          })
        );
        
        console.log('Processed chats data:', chatsData);
        
        // Sort chats by lastMessageTime manually
        const sortedChats = chatsData.sort((a, b) => {
          const aTime = a.lastMessageTime?.toDate ? a.lastMessageTime.toDate().getTime() : 0;
          const bTime = b.lastMessageTime?.toDate ? b.lastMessageTime.toDate().getTime() : 0;
          return bTime - aTime;
        });
        
        setRecentChats(sortedChats.slice(0, 10)); // Limit to 10 most recent
        
        // Calculate total unread count with better logic
        let totalUnread = 0;
        const now = new Date();
        
        chatsData.forEach(chat => {
          if (chat.lastMessageTime && chat.lastMessageSender !== user.uid) {
            const messageTime = chat.lastMessageTime.toDate ? chat.lastMessageTime.toDate() : new Date(chat.lastMessageTime);
            
            // Count as unread if message is newer than last seen time
            // or within the last 24 hours (fallback)
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            if (messageTime > lastSeenMessageTime || messageTime > oneDayAgo) {
              totalUnread++;
            }
          }
        });
        
        setUnreadCount(totalUnread);
        setLoading(false);
        console.log('Chats loading completed successfully');
      } catch (error) {
        console.error('Error loading chats:', error);
        // If the ordered query fails, try a simpler query
        try {
          console.log('Trying fallback query...');
          const simpleQuery = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', user.uid),
            limit(10)
          );
          
          const simpleSnapshot = await getDocs(simpleQuery);
          console.log('Fallback query result:', simpleSnapshot.docs.length, 'docs');
          const simpleChatsData = simpleSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            participantDetails: {}
          })) as Chat[];
          
          setRecentChats(simpleChatsData);
          setUnreadCount(0);
          setLoading(false);
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          setRecentChats([]);
          setUnreadCount(0);
          setLoading(false);
        }
      }
    }, (error) => {
      console.error('Error in chat listener:', error);
      // Try fallback query
      const fallbackQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid),
        limit(10)
      );
      
      getDocs(fallbackQuery).then(snapshot => {
        console.log('Fallback query successful:', snapshot.docs.length, 'docs');
        const fallbackChatsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          participantDetails: {}
        })) as Chat[];
        setRecentChats(fallbackChatsData);
        setUnreadCount(0);
        setLoading(false);
      }).catch(fallbackError => {
        console.error('Fallback query failed:', fallbackError);
        setRecentChats([]);
        setUnreadCount(0);
        setLoading(false);
      });
    });

    return () => unsubscribe();
  }, [user, showMessages]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const isNewMessage = (chat: Chat) => {
    if (!chat.lastMessageTime || chat.lastMessageSender === user.uid) return false;
    const messageTime = chat.lastMessageTime.toDate ? chat.lastMessageTime.toDate() : new Date(chat.lastMessageTime);
    return messageTime > lastSeenMessageTime;
  };

  const handleMessagesDropdownOpen = () => {
    setShowMessages(true);
    // Update last seen message time to current time
    updateLastSeenMessageTime();
    // This will trigger a recalculation of unread count
  };

  return (
    <>
      {/* Hidden audio element for notifications */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT" type="audio/wav" />
      </audio>

      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-midnight-950/95 backdrop-blur-md border-b border-gray-200 dark:border-midnight-800 shadow-sm">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          {/* Left: Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity group">
              {/* Foundic Network Logo Icon */}
              <div className="relative">
                <svg width="32" height="32" viewBox="0 0 32 32" className="text-teal-500">
                  {/* Diamond background */}
                  <rect x="8" y="8" width="16" height="16" rx="2" fill="currentColor" transform="rotate(45 16 16)" />
                  {/* Arrow elements */}
                  <path d="M12 10 L16 14 L20 10" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 22 L16 18 L20 22" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 12 L14 16 L10 20" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 12 L18 16 L22 20" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {/* Text */}
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-gray-900 dark:text-white font-bold text-lg tracking-tight">Foundic</span>
                <span className="text-teal-500 font-medium text-xs tracking-widest uppercase">Network</span>
              </div>
            </a>
          </div>
          
          {/* Center: Search Bar */}
          <div className="flex-1 max-w-2xl mx-4 sm:mx-8 lg:mx-12">
            <div className="relative">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search users, posts, tags..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => searchQuery.length >= 2 && fetchSearchSuggestions(searchQuery)}
                  onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 150)}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-midnight-800 border border-gray-200 dark:border-midnight-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>

              {/* Search Suggestions Dropdown */}
              {showSearchSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-midnight-900 border border-gray-200 dark:border-midnight-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                  {searchSuggestions.map((suggestion) => (
                    <a
                      key={suggestion.id}
                      href={`/user/${suggestion.id}`}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-midnight-800 transition-colors border-b border-gray-100 dark:border-midnight-700 last:border-b-0 cursor-pointer no-underline"
                      onClick={(e) => {
                        console.log('Suggestion clicked:', suggestion);
                        console.log('Navigating to:', `/user/${suggestion.id}`);
                        setShowSearchSuggestions(false);
                        setSearchQuery('');
                      }}
                      onMouseDown={(e) => {
                        // Prevent input blur when clicking suggestion
                        e.preventDefault();
                      }}
                    >
                      <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {suggestion.profilePicture ? (
                          <img
                            src={suggestion.profilePicture}
                            alt={suggestion.title}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          suggestion.avatar
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">{suggestion.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{suggestion.subtitle}</p>
                      </div>
                      <div className="text-xs text-gray-400 bg-gray-100 dark:bg-midnight-800 px-2 py-1 rounded flex-shrink-0">
                        {suggestion.type}
                      </div>
                    </a>
                  ))}
                  <div className="p-2 border-t border-gray-200 dark:border-midnight-700">
                    <button
                      onClick={() => {
                        setShowSearchSuggestions(false);
                        handleSearch({ preventDefault: () => {} } as any);
                      }}
                      className="w-full text-left text-sm text-teal-500 hover:text-teal-600 transition-colors p-2 rounded hover:bg-teal-50 dark:hover:bg-teal-500/10"
                    >
                      See all results for "{searchQuery}"
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right: User Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Notifications Dropdown */}
            {user && (
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-lg transition-colors relative ${
                    notificationCount > 0 
                      ? 'text-teal-500 bg-teal-50 dark:bg-teal-500/10' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-teal-500 hover:bg-gray-100 dark:hover:bg-midnight-800'
                  }`}
                >
                  <svg 
                    className={`w-5 h-5 transition-all ${
                      notificationCount > 0 ? 'animate-pulse' : ''
                    }`} 
                    fill={notificationCount > 0 ? "currentColor" : "none"} 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-4-4V8a6 6 0 10-12 0v5l-4 4h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-bounce shadow-lg">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                  {/* Instagram-like dot indicator for when there are notifications */}
                  {notificationCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-midnight-900 border border-gray-200 dark:border-midnight-700 rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-midnight-700">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                        {notificationCount > 0 && (
                          <button 
                            onClick={markAllNotificationsAsRead}
                            className="text-sm text-teal-500 hover:text-teal-600 transition-colors"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-600 dark:text-gray-400">
                          <div className="text-2xl mb-2">🔔</div>
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => markNotificationAsRead(notification.id)}
                            className={`block p-3 hover:bg-gray-50 dark:hover:bg-midnight-800 transition-colors border-b border-gray-100 dark:border-midnight-700 last:border-b-0 cursor-pointer ${
                              !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="relative">
                                <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {notification.type === 'like' ? '❤️' :
                                   notification.type === 'comment' ? '💬' :
                                   notification.type === 'follow' ? '👥' :
                                   notification.type === 'pod_interest' ? '⚡' :
                                   '🔔'}
                                </div>
                                {!notification.read && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-medium text-sm ${
                                  !notification.read ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                                }`}>
                                  {notification.title}
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <span className="text-xs text-gray-500 dark:text-gray-500 mt-1 block">
                                  {formatTime(notification.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Messages Dropdown */}
            {user && (
              <div className="relative">
                <button 
                  onClick={() => showMessages ? setShowMessages(false) : handleMessagesDropdownOpen()}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-teal-500 hover:bg-gray-100 dark:hover:bg-midnight-800 rounded-lg transition-colors relative"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Messages Dropdown */}
                {showMessages && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-midnight-900 border border-gray-200 dark:border-midnight-700 rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-midnight-700">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Messages</h3>
                        <a 
                          href="/chat" 
                          className="text-sm text-teal-500 hover:text-teal-600 transition-colors"
                          onClick={() => setShowMessages(false)}
                        >
                          View all
                        </a>
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {loading ? (
                        <div className="p-4 text-center text-gray-600 dark:text-gray-400">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500 mx-auto mb-2"></div>
                          Loading messages...
                        </div>
                      ) : recentChats.length === 0 ? (
                        <div className="p-4 text-center text-gray-600 dark:text-gray-400">
                          <div className="text-2xl mb-2">💬</div>
                          <p className="text-sm">No messages yet</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Start a conversation to see messages here</p>
                        </div>
                      ) : (
                        recentChats.map(chat => {
                          const otherParticipant = chat.participants.find(p => p !== user.uid);
                          const participantDetails = chat.participantDetails?.[otherParticipant!];
                          const isNew = isNewMessage(chat);
                          
                          console.log('Rendering chat:', chat.id);
                          console.log('Other participant:', otherParticipant);
                          console.log('Participant details:', participantDetails);
                          console.log('Display name will be:', participantDetails?.name || 'User');
                          
                          return (
                            <a
                              key={chat.id}
                              href={`/chat`}
                              onClick={() => setShowMessages(false)}
                              className={`block p-3 hover:bg-gray-50 dark:hover:bg-midnight-800 transition-colors border-b border-gray-100 dark:border-midnight-700 last:border-b-0 ${
                                isNew ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3 w-full overflow-hidden">
                                <div className="relative flex-shrink-0">
                                  <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {participantDetails?.avatar || 'U'}
                                  </div>
                                  {isNew && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className={`font-medium text-sm truncate flex-1 pr-2 ${
                                      isNew ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                                    }`} style={{maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                      {(participantDetails?.name && participantDetails.name.length < 50) ? participantDetails.name : 'User'}
                                    </h4>
                                    {chat.lastMessageTime && (
                                      <span className={`text-xs flex-shrink-0 ${
                                        isNew ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                                      }`}>
                                        {formatTime(chat.lastMessageTime)}
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-sm truncate mb-1 ${
                                    isNew ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400'
                                  }`}>
                                    {chat.lastMessage?.content || 'No messages yet'}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-500 capitalize truncate">
                                    {participantDetails?.role || 'Member'}
                                  </p>
                                </div>
                              </div>
                            </a>
                          );
                        })
                      )}
                    </div>

                    <div className="p-3 border-t border-gray-200 dark:border-midnight-700">
                      <a 
                        href="/chat" 
                        className="block w-full text-center py-2 px-4 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-medium"
                        onClick={() => setShowMessages(false)}
                      >
                        Start New Chat
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* User menu */}
            {user && <UserDropdown />}
          </div>
        </div>

        {/* Click outside to close dropdown */}
        {showMessages && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMessages(false)}
          />
        )}
      </nav>

      {/* New Message Notification Toast */}
      {newMessageNotification && (
        <div className="fixed top-20 right-4 z-50 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg animate-slide-in">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">{newMessageNotification}</span>
          </div>
        </div>
      )}
    </>
  );
}
