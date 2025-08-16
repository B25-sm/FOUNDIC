"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../src/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, doc, getDoc, Timestamp, getDocs } from 'firebase/firestore';
import UserDropdown from './UserDropdown';

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

export default function Navbar() {
  const [user] = useAuthState(auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMessages, setShowMessages] = useState(false);
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [newMessageNotification, setNewMessageNotification] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  // Play notification sound
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        // Ignore errors if audio can't play
      });
    }
  };

  // Fetch recent chats for messages dropdown
  useEffect(() => {
    if (!user) return;

    console.log('Starting to fetch chats for user:', user.uid);
    setLoading(true);
    
    // Try to get chats with lastMessageTime first
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTime', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
      console.log('Chats snapshot received, docs count:', snapshot.docs.length);
      try {
        const chatsData = await Promise.all(
          snapshot.docs.map(async (docSnapshot) => {
            const chatData = docSnapshot.data() as Chat;
            const chatId = docSnapshot.id;
            console.log('Processing chat:', chatId, chatData);
            
            // Get participant details
            const participantDetails: { [key: string]: any } = {};
            for (const participantId of chatData.participants) {
              if (participantId !== user.uid) {
                try {
                  const userDocRef = doc(db, 'users', participantId);
                  const userDocSnap = await getDoc(userDocRef);
                  if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    participantDetails[participantId] = {
                      name: userData.displayName || userData.email?.split('@')[0] || 'User',
                      role: userData.role || 'Member',
                      avatar: userData.avatar || userData.displayName?.[0] || userData.email?.[0] || 'U'
                    };
                  }
                } catch (error) {
                  console.error('Error fetching user details:', error);
                  participantDetails[participantId] = {
                    name: 'User',
                    role: 'Member',
                    avatar: 'U'
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
        
        // Check for new messages and show notifications
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        
        chatsData.forEach(chat => {
          if (chat.lastMessageTime && chat.lastMessageSender !== user.uid) {
            const messageTime = chat.lastMessageTime.toDate ? chat.lastMessageTime.toDate() : new Date(chat.lastMessageTime);
            if (messageTime > fiveMinutesAgo) {
              const participantName = chat.participantDetails?.[chat.lastMessageSender!]?.name || 'Someone';
              setNewMessageNotification(`${participantName} sent you a message`);
              
              // Play notification sound if not focused on messages
              if (!showMessages) {
                playNotificationSound();
              }
              
              // Clear notification after 5 seconds
              setTimeout(() => setNewMessageNotification(null), 5000);
            }
          }
        });
        
        setRecentChats(chatsData);
        
        // Calculate total unread count
        let totalUnread = 0;
        chatsData.forEach(chat => {
          if (chat.lastMessageTime && chat.lastMessageSender !== user.uid) {
            const messageTime = chat.lastMessageTime.toDate ? chat.lastMessageTime.toDate() : new Date(chat.lastMessageTime);
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            if (messageTime > oneDayAgo) {
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
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return messageTime > fiveMinutesAgo;
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
            <a href="/" className="flex items-center gap-1 hover:opacity-90 transition-opacity group">
              <div className="w-8 h-8 bg-gold-950 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-gold-950/25 transition-shadow">
                <span className="text-white font-black text-lg">F</span>
              </div>
              <span className="text-gray-900 dark:text-white font-bold text-xl tracking-tight hidden sm:block">oundic</span>
            </a>
          </div>
          
          {/* Center: Search Bar */}
          <div className="flex-1 max-w-2xl mx-4 sm:mx-8 lg:mx-12">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search users, posts, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-midnight-800 border border-gray-200 dark:border-midnight-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-950 focus:border-transparent transition-all"
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
          </div>
          
          {/* Right: User Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Messages Dropdown */}
            {user && (
              <div className="relative">
                <button 
                  onClick={() => setShowMessages(!showMessages)}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gold-950 hover:bg-gray-100 dark:hover:bg-midnight-800 rounded-lg transition-colors relative"
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
                          className="text-sm text-gold-950 hover:text-gold-900 transition-colors"
                          onClick={() => setShowMessages(false)}
                        >
                          View all
                        </a>
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {loading ? (
                        <div className="p-4 text-center text-gray-600 dark:text-gray-400">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gold-950 mx-auto mb-2"></div>
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
                          
                          return (
                            <a
                              key={chat.id}
                              href={`/chat`}
                              onClick={() => setShowMessages(false)}
                              className={`block p-3 hover:bg-gray-50 dark:hover:bg-midnight-800 transition-colors border-b border-gray-100 dark:border-midnight-700 last:border-b-0 ${
                                isNew ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <div className="w-10 h-10 bg-gold-950 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {participantDetails?.avatar || 'U'}
                                  </div>
                                  {isNew && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h4 className={`font-medium truncate ${
                                      isNew ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                                    }`}>
                                      {participantDetails?.name || 'User'}
                                    </h4>
                                    {chat.lastMessageTime && (
                                      <span className={`text-xs ${
                                        isNew ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                                      }`}>
                                        {formatTime(chat.lastMessageTime)}
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-sm truncate ${
                                    isNew ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400'
                                  }`}>
                                    {chat.lastMessage?.content || 'No messages yet'}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-500 capitalize">
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
                        className="block w-full text-center py-2 px-4 bg-gold-950 text-white rounded-lg hover:bg-gold-900 transition-colors text-sm font-medium"
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
