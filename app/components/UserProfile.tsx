"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../src/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  collection, 
  query, 
  where, 
  onSnapshot,
  addDoc,
  Timestamp,
  getDocs,
  orderBy
} from 'firebase/firestore';
import toast from 'react-hot-toast';

interface UserProfileProps {
  userId: string;
  onClose: () => void;
}

interface UserData {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  fCoins?: number;
  followers?: string[];
  following?: string[];
  createdAt?: any;
  bio?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  company?: string;
  position?: string;
  industry?: string;
  experience?: string;
  education?: string;
  skills?: string[];
  achievements?: string[];
  profilePicture?: string; // Added for profile picture
  instagram?: string; // Added for social links
  github?: string; // Added for social links
  portfolio?: string; // Added for social links
  resume?: string; // Added for social links
}

interface UserPost {
  id: string;
  content: string;
  type: string;
  likes: string[];
  comments: any[];
  createdAt: any;
  images?: string[];
}

export default function UserProfile({ userId, onClose }: UserProfileProps) {
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatId, setChatId] = useState<string>('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    if (!userId) return;

    // Get user data
    const getUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserData;
          setUserData(data);
          
          // Check if current user is following this user
          if (user && data.followers) {
            setFollowing(data.followers.includes(user.uid));
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user profile');
      }
    };

    // Get user's posts
    const postsQuery = query(
      collection(db, 'posts'),
      where('authorId', '==', userId)
    );

    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserPost[];
      
      // Sort by creation date
      posts.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return bTime - aTime;
      });
      
      setUserPosts(posts);
      setLoading(false);
    });

    getUserData();

    return () => unsubscribePosts();
  }, [userId, user]);

  // Load chat messages when chat modal opens
  useEffect(() => {
    if (!showChatModal || !user || !userId) return;

    const loadChat = async () => {
      try {
        // Check if chat already exists
        const existingChatQuery = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', user.uid)
        );
        const existingChats = await getDocs(existingChatQuery);
        
        const existingChat = existingChats.docs.find(doc => {
          const data = doc.data();
          return data.participants.includes(userId) && data.participants.length === 2;
        });

        if (existingChat) {
          setChatId(existingChat.id);
          // Load existing messages
          const messagesQuery = query(
            collection(db, 'chats', existingChat.id, 'messages'),
            orderBy('timestamp', 'asc')
          );
          
          const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setChatMessages(messages);
          });

          return () => unsubscribeMessages();
        } else {
          setChatId('');
          setChatMessages([]);
        }
      } catch (error) {
        console.error('Error loading chat:', error);
      }
    };

    loadChat();
  }, [showChatModal, user, userId]);

  const handleFollow = async () => {
    if (!user || !userData) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const targetUserRef = doc(db, 'users', userId);

      if (following) {
        // Unfollow
        await updateDoc(userRef, {
          following: arrayRemove(userId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayRemove(user.uid)
        });
        setFollowing(false);
        toast.success('Unfollowed successfully');
      } else {
        // Follow
        await updateDoc(userRef, {
          following: arrayUnion(userId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayUnion(user.uid)
        });
        setFollowing(true);
        toast.success('Followed successfully');
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      toast.error('Failed to update follow status');
    }
  };

  const sendMessage = async () => {
    if (!user || !userData || !chatMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      let currentChatId = chatId;

      if (!currentChatId) {
        // Create new chat
        const chatData = {
          participants: [user.uid, userId],
          createdAt: Timestamp.now()
        };
        const chatRef = await addDoc(collection(db, 'chats'), chatData);
        currentChatId = chatRef.id;
        setChatId(currentChatId);
      }

      // Send message
      const messageData = {
        content: chatMessage.trim(),
        senderId: user.uid,
        senderName: user.displayName || user.email || 'You',
        timestamp: Timestamp.now(),
        read: false
      };

      await addDoc(collection(db, 'chats', currentChatId, 'messages'), messageData);
      
      // Update chat's last message
      await updateDoc(doc(db, 'chats', currentChatId), {
        lastMessage: messageData
      });

      setChatMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getPostTypeIcon = (type: string): string => {
    const icons: { [key: string]: string } = {
      general: '📝',
      milestone: '🎯',
      lesson: '💡',
      question: '❓',
      opportunity: '🚀',
      celebration: '🎉',
      fail: '💪',
      investor: '💰',
      job: '💼'
    };
    return icons[type] || '📝';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-midnight-900 rounded-lg p-8 max-w-md w-full text-center">
          <div className="text-support/60">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-midnight-900 rounded-lg p-8 max-w-md w-full text-center">
          <div className="text-support/60">User not found</div>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-teal-500 text-midnight-950 rounded-lg hover:bg-teal-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-midnight-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-midnight-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {userData?.profilePicture ? (
                <img
                  src={userData.profilePicture}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border-2 border-teal-500"
                />
              ) : (
                <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center text-midnight-950 font-bold text-2xl">
                  {userData?.displayName?.[0] || userData?.email?.[0] || 'U'}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-support">{userData?.displayName || userData?.email}</h1>
                <p className="text-support/60 capitalize">{userData?.role || 'Member'}</p>
                <p className="text-sm text-support/60">{userData?.email}</p>
                {userData?.location && (
                  <p className="text-sm text-support/60">📍 {userData.location}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-support/60 hover:text-support text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Stats */}
              <div className="bg-midnight-800 rounded-lg p-4">
                <h3 className="font-semibold text-support mb-3">Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-teal-500">{userData?.followers?.length || 0}</div>
                    <div className="text-sm text-support/60">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-teal-500">{userData?.following?.length || 0}</div>
                    <div className="text-sm text-support/60">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-teal-500">{userPosts.length}</div>
                    <div className="text-sm text-support/60">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-teal-500">{userData?.fCoins || 0}</div>
                    <div className="text-sm text-support/60">F-Coins</div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {userData?.bio && (
                <div className="bg-midnight-800 rounded-lg p-4">
                  <h3 className="font-semibold text-support mb-2">About</h3>
                  <p className="text-support/80">{userData.bio}</p>
                </div>
              )}

              {/* Professional Info */}
              {(userData?.company || userData?.position || userData?.industry) && (
                <div className="bg-midnight-800 rounded-lg p-4">
                  <h3 className="font-semibold text-support mb-3">Professional</h3>
                  <div className="space-y-2">
                    {userData.position && userData.company && (
                      <div className="text-sm text-support/80">
                        <div className="font-medium">{userData.position}</div>
                        <div className="text-support/60">{userData.company}</div>
                      </div>
                    )}
                    {userData.industry && (
                      <div className="text-sm text-support/80">
                        <span className="text-support/60">Industry:</span> {userData.industry}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Info */}
              {(userData?.website || userData?.linkedin || userData?.twitter || userData?.instagram || userData?.github || userData?.portfolio || userData?.resume) && (
                <div className="bg-midnight-800 rounded-lg p-4">
                  <h3 className="font-semibold text-support mb-3">Links</h3>
                  <div className="space-y-2">
                    {userData.website && (
                      <div className="flex items-center gap-2 text-sm text-support/80">
                        <span>🌐</span>
                        <a href={userData.website} target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:underline">
                          Website
                        </a>
                      </div>
                    )}
                    {userData.linkedin && (
                      <div className="flex items-center gap-2 text-sm text-support/80">
                        <span>💼</span>
                        <a href={userData.linkedin} target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:underline">
                          LinkedIn
                        </a>
                      </div>
                    )}
                    {userData.twitter && (
                      <div className="flex items-center gap-2 text-sm text-support/80">
                        <span>🐦</span>
                        <a href={userData.twitter} target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:underline">
                          X (Twitter)
                        </a>
                      </div>
                    )}
                    {userData.instagram && (
                      <div className="flex items-center gap-2 text-sm text-support/80">
                        <span>📷</span>
                        <a href={userData.instagram} target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:underline">
                          Instagram
                        </a>
                      </div>
                    )}
                    {userData.github && (
                      <div className="flex items-center gap-2 text-sm text-support/80">
                        <span>💻</span>
                        <a href={userData.github} target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:underline">
                          GitHub
                        </a>
                      </div>
                    )}
                    {userData.portfolio && (
                      <div className="flex items-center gap-2 text-sm text-support/80">
                        <span>🎨</span>
                        <a href={userData.portfolio} target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:underline">
                          Portfolio
                        </a>
                      </div>
                    )}
                    {userData.resume && (
                      <div className="flex items-center gap-2 text-sm text-support/80">
                        <span>📄</span>
                        <a href={userData.resume} target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:underline">
                          Resume
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Experience & Education */}
              {(userData?.experience || userData?.education) && (
                <div className="bg-midnight-800 rounded-lg p-4">
                  <h3 className="font-semibold text-support mb-3">Background</h3>
                  <div className="space-y-3">
                    {userData.experience && (
                      <div>
                        <div className="text-sm font-medium text-support/80 mb-1">Experience</div>
                        <div className="text-sm text-support/60">{userData.experience}</div>
                      </div>
                    )}
                    {userData.education && (
                      <div>
                        <div className="text-sm font-medium text-support/80 mb-1">Education</div>
                        <div className="text-sm text-support/60">{userData.education}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Skills */}
              {userData?.skills && userData.skills.length > 0 && (
                <div className="bg-midnight-800 rounded-lg p-4">
                  <h3 className="font-semibold text-support mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {userData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-teal-500/20 text-teal-500 rounded-full text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Posts */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-support">Recent Posts</h3>
                {user && user.uid !== userId && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowChatModal(true)}
                      className="px-4 py-2 bg-teal-500 text-midnight-950 rounded-lg hover:bg-teal-600 transition-colors"
                    >
                      💬 Message
                    </button>
                    <button
                      onClick={handleFollow}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        following
                          ? 'bg-midnight-700 text-support hover:bg-midnight-600'
                          : 'bg-teal-500 text-midnight-950 hover:bg-teal-600'
                      }`}
                    >
                      {following ? 'Following' : 'Follow'}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {userPosts.length === 0 ? (
                  <div className="text-center py-8 text-support/60">
                    No posts yet
                  </div>
                ) : (
                  userPosts.map(post => (
                    <div key={post.id} className="bg-midnight-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">{getPostTypeIcon(post.type)}</span>
                        <span className="text-xs text-support/60 capitalize">{post.type}</span>
                        <span className="text-xs text-support/60 ml-auto">
                          {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : 'now'}
                        </span>
                      </div>
                      <div className="text-support/90 mb-3">{post.content}</div>
                      
                      {/* Display images if present */}
                      {post.images && post.images.length > 0 && (
                        <div className="mb-3">
                          <div className={`grid gap-2 ${
                            post.images.length === 1 ? 'grid-cols-1' :
                            post.images.length === 2 ? 'grid-cols-2' :
                            'grid-cols-3'
                          }`}>
                            {post.images.map((imageUrl, index) => (
                              <img
                                key={index}
                                src={imageUrl}
                                alt={`Post image ${index + 1}`}
                                className="w-full aspect-square object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-4 text-support/70 text-sm">
                        <span>👍 {post.likes?.length || 0}</span>
                        <span>💬 {post.comments?.length || 0}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Modal */}
        {showChatModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-midnight-900 rounded-lg max-w-md w-full max-h-[80vh] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-midnight-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {userData?.profilePicture ? (
                    <img
                      src={userData.profilePicture}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover border border-teal-500"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-midnight-950 font-bold">
                      {userData?.displayName?.[0] || userData?.email?.[0] || 'U'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-support">
                      {userData?.displayName || userData?.email}
                    </h3>
                    <p className="text-xs text-support/60 capitalize">
                      {userData?.role || 'Member'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChatModal(false)}
                  className="text-support/60 hover:text-support text-xl"
                >
                  ✕
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-support/60 py-8">
                    <div className="text-2xl mb-2">💬</div>
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs">Start the conversation!</p>
                  </div>
                ) : (
                  chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-lg ${
                          message.senderId === user?.uid
                            ? 'bg-teal-500 text-midnight-950'
                            : 'bg-midnight-800 text-support'
                        }`}
                      >
                        <div className="text-sm font-medium mb-1">
                          {message.senderId === user?.uid ? 'You' : userData?.displayName || userData?.email}
                        </div>
                        <div className="text-sm">{message.content}</div>
                        <div className={`text-xs mt-1 ${
                          message.senderId === user?.uid ? 'text-midnight-950/70' : 'text-support/60'
                        }`}>
                          {message.timestamp?.toDate ? 
                            message.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                            'now'
                          }
                          {message.senderId === user?.uid && (
                            <span className="ml-2">
                              {message.read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-midnight-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 bg-midnight-800 border border-midnight-700 rounded-lg text-support placeholder-support/50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    disabled={sendingMessage}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!chatMessage.trim() || sendingMessage}
                    className="px-4 py-2 bg-teal-500 text-midnight-950 rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sendingMessage ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
