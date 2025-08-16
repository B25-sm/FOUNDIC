"use client";

import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../src/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  Timestamp,
  doc,
  getDoc,
  where,
  getDocs,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import AuthGuard from '../components/AuthGuard';

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
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: any;
  senderName: string;
}

export default function ChatPage() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');

  useEffect(() => {
    if (!user) return;

    console.log('Starting to fetch chats for user:', user.uid);
    setLoading(true);
    
    // Try to get chats with lastMessageTime first
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTime', 'desc')
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
        
        // Sort by creation date manually to avoid index requirement
        chatsData.sort((a, b) => {
          const aTime = a.lastMessageTime?.toDate ? a.lastMessageTime.toDate().getTime() : 0;
          const bTime = b.lastMessageTime?.toDate ? b.lastMessageTime.toDate().getTime() : 0;
          return bTime - aTime;
        });
        
        setChats(chatsData);
        setLoading(false);
        console.log('Chats loading completed successfully');
      } catch (error) {
        console.error('Error loading chats:', error);
        // If the ordered query fails, try a simpler query
        try {
          console.log('Trying fallback query...');
          const simpleQuery = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', user.uid)
          );
          
          const simpleSnapshot = await getDocs(simpleQuery);
          console.log('Fallback query result:', simpleSnapshot.docs.length, 'docs');
          const simpleChatsData = simpleSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            participantDetails: {}
          })) as Chat[];
          
          setChats(simpleChatsData);
          setLoading(false);
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          setChats([]);
          setLoading(false);
        }
      }
    }, (error) => {
      console.error('Error in chat listener:', error);
      // Try fallback query
      const fallbackQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid)
      );
      
      getDocs(fallbackQuery).then(snapshot => {
        console.log('Fallback query successful:', snapshot.docs.length, 'docs');
        const fallbackChatsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          participantDetails: {}
        })) as Chat[];
        setChats(fallbackChatsData);
        setLoading(false);
      }).catch(fallbackError => {
        console.error('Fallback query failed:', fallbackError);
        setChats([]);
        setLoading(false);
      });
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Fetch all users for new chat
    const usersQuery = query(collection(db, 'users'));
    getDocs(usersQuery).then((snapshot) => {
      const usersData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(userData => userData.id !== user.uid);
      setUsers(usersData);
    });
  }, [user]);

  useEffect(() => {
    if (!selectedChat || !user) return;

    // Fetch messages for selected chat
    const messagesQuery = query(
      collection(db, 'chats', selectedChat.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [selectedChat, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !user || sending) return;

    setSending(true);
    try {
      const messageData = {
        senderId: user.uid,
        content: newMessage.trim(),
        timestamp: Timestamp.now(),
        senderName: user.displayName || user.email?.split('@')[0] || 'You'
      };

      await addDoc(collection(db, 'chats', selectedChat.id, 'messages'), messageData);
      
      // Update chat's last message
      await updateDoc(doc(db, 'chats', selectedChat.id), {
        lastMessage: {
          content: newMessage.trim(),
          senderId: user.uid,
          senderName: user.displayName || user.email?.split('@')[0] || 'You',
          timestamp: Timestamp.now(),
          read: false
        },
        lastMessageTime: Timestamp.now(),
        lastMessageSender: user.uid
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const startNewChat = async () => {
    if (!selectedUser || !user) return;

    try {
      // Check if chat already exists
      const existingChatQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid)
      );
      
      const existingChats = await getDocs(existingChatQuery);
      const existingChat = existingChats.docs.find(doc => {
        const data = doc.data();
        return data.participants.includes(selectedUser);
      });

      if (existingChat) {
        setSelectedChat({ id: existingChat.id, ...existingChat.data() } as Chat);
        setShowNewChat(false);
        setSelectedUser('');
        return;
      }

      // Create new chat
      const chatData = {
        participants: [user.uid, selectedUser],
        createdAt: Timestamp.now(),
        lastMessageTime: Timestamp.now()
      };

      const chatRef = await addDoc(collection(db, 'chats'), chatData);
      
      // Get user details for the new chat
      const userDoc = await getDoc(doc(db, 'users', selectedUser));
      const userData = userDoc.data();
      
      const newChat: Chat = {
        id: chatRef.id,
        participants: [user.uid, selectedUser],
        participantDetails: {
          [selectedUser]: {
            name: userData?.displayName || userData?.email?.split('@')[0] || 'User',
            role: userData?.role || 'Member',
            avatar: userData?.avatar || userData?.displayName?.[0] || userData?.email?.[0] || 'U'
          }
        }
      };

      setSelectedChat(newChat);
      setShowNewChat(false);
      setSelectedUser('');
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <AuthGuard>
      <div className="flex h-full bg-white dark:bg-midnight-950">
        {/* Chat List Sidebar */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900">Messages</h1>
              <button
                onClick={() => setShowNewChat(true)}
                className="p-2 text-gold-950 hover:bg-gold-50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-950 focus:border-transparent"
              />
              <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-600">Loading chats...</div>
            ) : chats.length === 0 ? (
              <div className="p-4 text-center text-gray-600">
                <div className="text-4xl mb-2">💬</div>
                <p>No conversations yet</p>
                <p className="text-sm text-gray-500">Start a new chat to connect with others</p>
              </div>
            ) : (
              chats.map(chat => {
                const otherParticipant = chat.participants.find(p => p !== user.uid);
                const participantDetails = chat.participantDetails?.[otherParticipant!];
                
                return (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedChat?.id === chat.id ? 'bg-gold-50 border-gold-200' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gold-950 rounded-full flex items-center justify-center text-white font-bold">
                        {participantDetails?.avatar || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {participantDetails?.name || 'User'}
                          </h3>
                          {chat.lastMessageTime && (
                            <span className="text-xs text-gray-500">
                              {formatTime(chat.lastMessageTime)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {chat.lastMessage?.content || 'No messages yet'}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {participantDetails?.role || 'Member'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold-950 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedChat.participantDetails?.[selectedChat.participants.find(p => p !== user.uid)!]?.avatar || 'U'}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {selectedChat.participantDetails?.[selectedChat.participants.find(p => p !== user.uid)!]?.name || 'User'}
                    </h2>
                    <p className="text-sm text-gray-600 capitalize">
                      {selectedChat.participantDetails?.[selectedChat.participants.find(p => p !== user.uid)!]?.role || 'Member'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-600">
                    <div className="text-6xl mb-4">💬</div>
                    <p className="text-lg font-medium">No messages yet</p>
                    <p className="text-sm text-gray-500">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderId === user.uid
                            ? 'bg-gold-950 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.senderId === user.uid ? 'text-gold-200' : 'text-gray-500'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-950 focus:border-transparent"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="px-6 py-2 bg-gold-950 text-white rounded-lg hover:bg-gold-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-600">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm text-gray-500">Choose a chat from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </div>

        {/* New Chat Modal */}
        {showNewChat && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">New Conversation</h2>
                <button
                  onClick={() => {
                    setShowNewChat(false);
                    setSelectedUser('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-2">
                  {users.map(userData => (
                    <button
                      key={userData.id}
                      onClick={() => setSelectedUser(userData.id)}
                      className={`w-full p-3 text-left rounded-lg border transition-colors ${
                        selectedUser === userData.id
                          ? 'border-gold-950 bg-gold-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gold-950 rounded-full flex items-center justify-center text-white font-bold">
                          {userData.displayName?.[0] || userData.email?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {userData.displayName || userData.email?.split('@')[0] || 'User'}
                          </p>
                          <p className="text-sm text-gray-600 capitalize">
                            {userData.role || 'Member'}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowNewChat(false);
                    setSelectedUser('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={startNewChat}
                  disabled={!selectedUser}
                  className="flex-1 px-4 py-2 bg-gold-950 text-white rounded-lg hover:bg-gold-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Start Chat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
