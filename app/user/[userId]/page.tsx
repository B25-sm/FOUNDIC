"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useParams, useRouter } from 'next/navigation';
import { auth, db, storage } from '../../../src/firebase';
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
  orderBy,
  deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AuthGuard from '../../components/AuthGuard';
import toast from 'react-hot-toast';
import { createFollowNotification } from '../../utils/notifications';
import FollowersFollowingModal from '../../components/FollowersFollowingModal';

interface UserData {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  fCoins?: number;
  followers?: string[];
  following?: string[];
  savedPosts?: string[];
  createdAt?: any;
  bio?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  company?: string;
  position?: string;
  industry?: string;
  experience?: string;
  education?: string;
  skills?: string[];
  achievements?: string[];
  profilePicture?: string;
  coverPhoto?: string;
  instagram?: string;
  github?: string;
  portfolio?: string;
  resume?: string;
  whatsapp?: string;
  youtube?: string;
}

interface UserPost {
  id: string;
  content: string;
  type: string;
  likes: string[];
  comments: any[];
  createdAt: any;
  images?: string[];
  authorId?: string;
}

export default function UserProfilePage() {
  const [user] = useAuthState(auth);
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatId, setChatId] = useState<string>('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Image upload states
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [uploadingCoverPhoto, setUploadingCoverPhoto] = useState(false);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const coverPhotoInputRef = useRef<HTMLInputElement>(null);
  const [commentPost, setCommentPost] = useState<UserPost | null>(null);
  const [commentText, setCommentText] = useState('');
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<'followers' | 'following'>('followers');

  useEffect(() => {
    if (!userId) return;

    // Get user data with real-time updates
    const unsubscribeUser = onSnapshot(
      doc(db, 'users', userId),
      (userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data() as UserData;
          console.log('Profile page received user data:', data);
          setUserData(data);
          
          // Check if current user is following this user
          if (user && userDoc.data().followers?.includes(user.uid)) {
            setFollowing(true);
          } else {
            setFollowing(false);
          }
        }
      },
      (error) => {
        console.error('Error fetching user data:', error);
      }
    );

    // Get user posts with fallback handling
    try {
      const unsubscribePosts = onSnapshot(
        query(
          collection(db, 'posts'),
          where('authorId', '==', userId),
          orderBy('createdAt', 'desc')
        ),
        (snapshot) => {
          const posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as UserPost[];
          setUserPosts(posts);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching posts with orderBy, using fallback:', error);
          // Fallback query without orderBy
          const fallbackQuery = query(
            collection(db, 'posts'),
            where('authorId', '==', userId)
          );
          
          onSnapshot(fallbackQuery, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as UserPost[];
            
            // Sort manually by createdAt
            posts.sort((a, b) => {
              const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
              const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
              return bTime.getTime() - aTime.getTime();
            });
            
            setUserPosts(posts);
            setLoading(false);
          });
        }
      );

      return () => {
        unsubscribeUser();
        unsubscribePosts();
      };
    } catch (error) {
      console.error('Error setting up posts listener:', error);
      setLoading(false);
    }
  }, [userId, user, router]);

  // Load chat messages when chat modal opens - Fixed with better error handling
  useEffect(() => {
    if (!showChatModal || !user || !userId) return;

    const loadChat = async () => {
      try {
        // Get all chats and find the one with both participants
        const chatsSnapshot = await getDocs(collection(db, 'chats'));
        
        let foundChat = null;
        chatsSnapshot.forEach((doc) => {
          const chatData = doc.data();
          if (chatData.participants && 
              chatData.participants.includes(user.uid) && 
              chatData.participants.includes(userId)) {
            foundChat = { id: doc.id, ...chatData };
          }
        });

        if (foundChat) {
          setChatId(foundChat.id);
          
          // Listen to messages with better error handling
          try {
            const unsubscribeMessages = onSnapshot(
              collection(db, 'chats', foundChat.id, 'messages'),
              (snapshot) => {
                const messages = snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                })) as any[];
                
                // Sort messages by timestamp
                messages.sort((a: any, b: any) => {
                  const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(0);
                  const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(0);
                  return aTime.getTime() - bTime.getTime();
                });
                
                setChatMessages(messages);
              },
              (error) => {
                console.log('Messages listener error:', error);
                setChatMessages([]);
              }
            );
            
            return () => unsubscribeMessages();
          } catch (messageError) {
            console.log('Message loading error:', messageError);
            setChatMessages([]);
          }
        } else {
          setChatId('');
          setChatMessages([]);
        }
      } catch (error) {
        console.error('Error loading chat:', error);
        setChatId('');
        setChatMessages([]);
      }
    };

    loadChat();
  }, [showChatModal, user, userId]);

  const handleFollow = async () => {
    if (!user || !userData) return;

    try {
      const userDocRef = doc(db, 'users', userId);
      const currentUserDocRef = doc(db, 'users', user.uid);

      if (following) {
        // Unfollow
        await updateDoc(userDocRef, {
          followers: arrayRemove(user.uid)
        });
        await updateDoc(currentUserDocRef, {
          following: arrayRemove(userId)
        });
        setFollowing(false);
        toast.success('Unfollowed successfully');
      } else {
        // Follow
        await updateDoc(userDocRef, {
          followers: arrayUnion(user.uid)
        });
        await updateDoc(currentUserDocRef, {
          following: arrayUnion(userId)
        });
        setFollowing(true);
        toast.success('Following successfully');

        // Create follow notification
        await createFollowNotification(userId, user.uid);
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast.error('Failed to update follow status');
    }
  };

  // Handler functions for followers/following modal
  const handleFollowersClick = () => {
    setModalInitialTab('followers');
    setShowFollowersModal(true);
  };

  const handleFollowingClick = () => {
    setModalInitialTab('following');
    setShowFollowersModal(true);
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !user || sendingMessage) return;

    setSendingMessage(true);
    try {
      let currentChatId = chatId;

      // Create new chat if none exists
      if (!currentChatId) {
        const newChatRef = await addDoc(collection(db, 'chats'), {
          participants: [user.uid, userId],
          lastMessage: {
            content: chatMessage,
            senderId: user.uid,
            timestamp: Timestamp.now()
          },
          lastMessageTime: Timestamp.now(),
          createdAt: Timestamp.now()
        });
        currentChatId = newChatRef.id;
        setChatId(currentChatId);
      }

      // Add message to chat
      await addDoc(collection(db, 'chats', currentChatId, 'messages'), {
        content: chatMessage,
        senderId: user.uid,
        senderName: user.displayName || user.email,
        timestamp: Timestamp.now()
      });

      // Update chat's last message
      await updateDoc(doc(db, 'chats', currentChatId), {
        lastMessage: {
          content: chatMessage,
          senderId: user.uid,
          timestamp: Timestamp.now()
        },
        lastMessageTime: Timestamp.now()
      });

      setChatMessage('');
      toast.success('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 800px width, maintain aspect ratio)
        const maxWidth = 800;
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.8); // 80% quality
        resolve(base64);
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (file: File, type: 'profile' | 'cover') => {
    console.log('handleImageUpload called with:', { file, type, user: user?.uid });
    
    if (!user) {
      console.error('No user found for image upload');
      toast.error('You must be logged in to upload images');
      return;
    }

    if (!file) {
      console.error('No file provided for upload');
      return;
    }

    try {
      if (type === 'profile') {
        setUploadingProfilePic(true);
      } else {
        setUploadingCoverPhoto(true);
      }

      console.log('Starting image upload process...');
      let imageUrl;
      
      try {
        // Try Firebase Storage first
        console.log('Attempting Firebase Storage upload...');
        const imageRef = ref(storage, `${type}Pictures/${user.uid}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(imageRef, file);
        imageUrl = await getDownloadURL(snapshot.ref);
        console.log('Firebase Storage upload successful:', imageUrl);
      } catch (storageError) {
        console.log('Firebase Storage failed, using base64 fallback:', storageError);
        // Fallback to base64
        imageUrl = await convertImageToBase64(file);
        console.log('Base64 conversion successful, length:', imageUrl.length);
      }

      // Update user document
      console.log('Updating user document in Firestore...');
      const userRef = doc(db, 'users', user.uid);
      const updateData = {
        [type === 'profile' ? 'profilePicture' : 'coverPhoto']: imageUrl,
        updatedAt: new Date()
      };
      console.log('Update data:', updateData);
      
      await updateDoc(userRef, updateData);
      console.log('Firestore update successful');

      // Update local state
      setUserData(prev => prev ? {
        ...prev,
        [type === 'profile' ? 'profilePicture' : 'coverPhoto']: imageUrl
      } : null);

      toast.success(`${type === 'profile' ? 'Profile picture' : 'Cover photo'} updated successfully!`);
      console.log('Image upload completed successfully');
    } catch (error) {
      console.error(`Error uploading ${type} image:`, error);
      toast.error(`Failed to upload ${type === 'profile' ? 'profile picture' : 'cover photo'}. Please try again.`);
    } finally {
      if (type === 'profile') {
        setUploadingProfilePic(false);
      } else {
        setUploadingCoverPhoto(false);
      }
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <main className="min-h-screen bg-gray-900 text-white">
          <div className="text-gray-400 text-center py-8">Loading profile...</div>
        </main>
      </AuthGuard>
    );
  }

  if (!userData) {
    return (
      <AuthGuard>
        <main className="min-h-screen bg-gray-900 text-white">
          <div className="text-gray-400 text-center py-8">User not found</div>
        </main>
      </AuthGuard>
    );
  }

  const isOwnProfile = user && user.uid === userId;
  console.log('Profile ownership check:', { 
    currentUserId: user?.uid, 
    profileUserId: userId, 
    isOwnProfile,
    userEmail: user?.email 
  });

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
            <p className="text-gray-400">View all your profile details here.</p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column - User Profile Card */}
            <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">{userData?.displayName || userData?.email}</h2>
                <p className="text-green-400 text-sm mb-6">{userData?.role || 'Premium User'}</p>
                
                {/* Profile Picture */}
                <div className="relative inline-block mb-6">
                  {userData?.profilePicture ? (
                    <img
                      src={userData.profilePicture}
                      alt={userData.displayName}
                      className="w-48 h-48 rounded-full object-cover border-4 border-gray-600"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center border-4 border-gray-600">
                      <span className="text-white text-6xl font-bold">
                        {userData?.displayName?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  
                  {/* Camera icon for own profile */}
                  {isOwnProfile && (
                    <label className={`absolute bottom-4 right-4 rounded-full p-3 cursor-pointer transition-colors ${
                      uploadingProfilePic 
                        ? 'bg-blue-600 cursor-not-allowed' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}>
                      <input
                        ref={profilePicInputRef}
                        type="file"
                        accept="image/*"
                        disabled={uploadingProfilePic}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          console.log('Profile picture file selected:', file);
                          if (file) {
                            console.log('Starting profile picture upload...');
                            handleImageUpload(file, 'profile');
                          }
                        }}
                        className="hidden"
                      />
                      {uploadingProfilePic ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </label>
                  )}
                </div>

                {/* Stats Section */}
                <div className="flex justify-center gap-8 mt-6">
                  <button 
                    onClick={handleFollowersClick}
                    className="text-center hover:bg-gray-700/50 rounded-lg p-3 transition-colors"
                  >
                    <div className="text-2xl font-bold text-white">{userData?.followers?.length || 0}</div>
                    <div className="text-sm text-gray-400">Followers</div>
                  </button>
                  <button 
                    onClick={handleFollowingClick}
                    className="text-center hover:bg-gray-700/50 rounded-lg p-3 transition-colors"
                  >
                    <div className="text-2xl font-bold text-white">{userData?.following?.length || 0}</div>
                    <div className="text-sm text-gray-400">Following</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Bio & Details */}
            <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Bio & other details</h3>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">My Role</p>
                    {userData?.role || userData?.position ? (
                      <p className="text-white font-medium">{userData.role || userData.position}</p>
                    ) : (
                      <div className="text-gray-500">
                        <p className="text-sm">No role added yet</p>
                        {isOwnProfile && (
                          <button
                            onClick={() => router.push('/profile/edit')}
                            className="text-blue-400 hover:text-blue-300 text-xs mt-1"
                          >
                            Add Role →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-sm mb-1">My 3 Favorite Artists</p>
                    {userData?.skills && userData.skills.length > 0 ? (
                      <p className="text-white font-medium">{userData.skills.slice(0, 3).join(', ')}</p>
                    ) : (
                      <div className="text-gray-500">
                        <p className="text-sm">No favorite artists added</p>
                        {isOwnProfile && (
                          <button
                            onClick={() => router.push('/profile/edit')}
                            className="text-blue-400 hover:text-blue-300 text-xs mt-1"
                          >
                            Add Artists →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-sm mb-1">The Software or Equipment I Use</p>
                    {userData?.experience ? (
                      <p className="text-white font-medium">{userData.experience}</p>
                    ) : (
                      <div className="text-gray-500">
                        <p className="text-sm">No equipment listed</p>
                        {isOwnProfile && (
                          <button
                            onClick={() => router.push('/profile/edit')}
                            className="text-blue-400 hover:text-blue-300 text-xs mt-1"
                          >
                            Add Equipment →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-sm mb-1">My City or Region</p>
                    {userData?.location ? (
                      <p className="text-white font-medium">{userData.location}</p>
                    ) : (
                      <div className="text-gray-500">
                        <p className="text-sm">No location set</p>
                        {isOwnProfile && (
                          <button
                            onClick={() => router.push('/profile/edit')}
                            className="text-blue-400 hover:text-blue-300 text-xs mt-1"
                          >
                            Add Location →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Badges</p>
                    {userData?.achievements && userData.achievements.length > 0 ? (
                      <div className="flex items-center gap-2">
                        {userData.achievements.slice(0, 2).map((achievement, index) => (
                          <div key={index} className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <span>🏆</span>
                            {achievement}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <p className="text-sm">No badges earned yet</p>
                        {isOwnProfile && (
                          <p className="text-xs mt-1 text-gray-600">Complete activities to earn badges</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-6">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">My Experience Level</p>
                    {userData?.industry ? (
                      <p className="text-white font-medium">{userData.industry}</p>
                    ) : (
                      <div className="text-gray-500">
                        <p className="text-sm">No experience level set</p>
                        {isOwnProfile && (
                          <button
                            onClick={() => router.push('/profile/edit')}
                            className="text-blue-400 hover:text-blue-300 text-xs mt-1"
                          >
                            Set Experience Level →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-sm mb-1">My Favorite Music Genre</p>
                    {userData?.bio ? (
                      <p className="text-white font-medium">{userData.bio.split(' ').slice(0, 2).join(' ')}</p>
                    ) : (
                      <div className="text-gray-500">
                        <p className="text-sm">No genre preference set</p>
                        {isOwnProfile && (
                          <button
                            onClick={() => router.push('/profile/edit')}
                            className="text-blue-400 hover:text-blue-300 text-xs mt-1"
                          >
                            Add Genre →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-sm mb-1">My Preferred Music Mood</p>
                    {userData?.education ? (
                      <p className="text-white font-medium">{userData.education}</p>
                    ) : (
                      <div className="text-gray-500">
                        <p className="text-sm">No mood preference set</p>
                        {isOwnProfile && (
                          <button
                            onClick={() => router.push('/profile/edit')}
                            className="text-blue-400 hover:text-blue-300 text-xs mt-1"
                          >
                            Add Mood →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Availability</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-400 text-sm font-medium">Available for Collaboration</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Tags</p>
                    {userData?.skills && userData.skills.length > 0 ? (
                      <p className="text-white font-medium">
                        {userData.skills.map(skill => `#${skill}`).join(', ')}
                      </p>
                    ) : (
                      <div className="text-gray-500">
                        <p className="text-sm">No tags added</p>
                        {isOwnProfile && (
                          <button
                            onClick={() => router.push('/profile/edit')}
                            className="text-blue-400 hover:text-blue-300 text-xs mt-1"
                          >
                            Add Tags →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media Section */}
          <div className="mt-6">
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Social Media</h3>
              <div className="flex gap-4">
                {userData?.youtube && (
                  <a href={userData.youtube} target="_blank" rel="noopener noreferrer" 
                     className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center hover:bg-red-700 transition-colors">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                )}
                {userData?.instagram && (
                  <a href={userData.instagram} target="_blank" rel="noopener noreferrer"
                     className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-colors">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                )}
                {userData?.twitter && (
                  <a href={userData.twitter} target="_blank" rel="noopener noreferrer"
                     className="w-12 h-12 bg-black rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors border border-gray-600">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* My Productions Section */}
          <div className="mt-6">
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-6">My Productions</h3>
              
              {userPosts && userPosts.length > 0 ? (
                <>
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 text-gray-400 text-sm font-medium mb-4 pb-2 border-b border-gray-700">
                    <div className="col-span-5">Title</div>
                    <div className="col-span-2">Created</div>
                    <div className="col-span-2">Likes</div>
                    <div className="col-span-3">Actions</div>
                  </div>
                  
                  {/* User Posts */}
                  {userPosts.slice(0, 5).map((post, index) => (
                    <div key={post.id} className="grid grid-cols-12 gap-4 items-center py-3 hover:bg-gray-700/30 rounded-lg px-2 transition-colors">
                      <div className="col-span-5 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {post.content ? post.content.slice(0, 30) + (post.content.length > 30 ? '...' : '') : `Post ${index + 1}`}
                          </p>
                          <p className="text-gray-400 text-sm">{userData?.displayName}</p>
                        </div>
                      </div>
                      <div className="col-span-2 text-gray-300">
                        {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Recent'}
                      </div>
                      <div className="col-span-2 text-gray-300">{post.likes?.length || 0}</div>
                      <div className="col-span-3 flex items-center gap-2">
                        <button 
                          onClick={() => {
                            const isLiked = post.likes?.includes(user?.uid || '');
                            // Handle like functionality
                          }}
                          className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                        <button className="p-2 hover:bg-gray-600 rounded-lg transition-colors">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => setCommentPost(post)}
                          className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-400 mb-2">No productions yet</h4>
                    <p className="text-sm text-gray-500">
                      {isOwnProfile 
                        ? "Start creating posts to showcase your work here" 
                        : "This user hasn't shared any productions yet"
                      }
                    </p>
                  </div>
                  {isOwnProfile && (
                    <button
                      onClick={() => router.push('/wall')}
                      className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                    >
                      Create Your First Post
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* My Collection Section */}
          <div className="mt-6 mb-8">
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">My Collection</h3>
                {isOwnProfile && (
                  <button
                    onClick={() => router.push('/profile/edit')}
                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                  >
                    Edit Profile →
                  </button>
                )}
              </div>
              
              {userData?.savedPosts && userData.savedPosts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {userData.savedPosts.slice(0, 6).map((postId, index) => (
                    <div key={index} className="group cursor-pointer">
                      <div className={`aspect-square bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl mb-2 relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <svg className="w-8 h-8 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-white text-sm font-medium truncate">Saved Post</p>
                      <p className="text-gray-400 text-xs">From Feed</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-400 mb-2">No saved items yet</h4>
                    <p className="text-sm text-gray-500">
                      {isOwnProfile 
                        ? "Save posts from the feed to build your collection" 
                        : "This user hasn't saved any content yet"
                      }
                    </p>
                  </div>
                  {isOwnProfile && (
                    <button
                      onClick={() => router.push('/wall')}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      Explore Feed
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons for non-own profiles */}
          {user && user.uid !== userId && (
            <div className="fixed bottom-6 right-6 flex gap-3">
              <button
                onClick={handleFollow}
                className={`px-6 py-3 rounded-xl font-medium transition-colors shadow-lg ${
                  following
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {following ? 'Following' : 'Follow'}
              </button>
              <button
                onClick={() => setShowChatModal(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium shadow-lg"
              >
                Message
              </button>
            </div>
          )}
        </div>

        {/* Chat Modal */}
        {showChatModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl max-w-md w-full max-h-[80vh] flex flex-col border border-gray-700">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {userData?.profilePicture ? (
                    <img
                      src={userData.profilePicture}
                      alt={userData.displayName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {userData?.displayName?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <span className="font-medium text-white">{userData?.displayName}</span>
                </div>
                <button
                  onClick={() => setShowChatModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg ${
                            message.senderId === user?.uid
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-white'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp?.toDate ? message.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim() || sendingMessage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingMessage ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Followers/Following Modal */}
        <FollowersFollowingModal
          isOpen={showFollowersModal}
          onClose={() => setShowFollowersModal(false)}
          userId={userId}
          initialTab={modalInitialTab}
        />
      </main>
    </AuthGuard>
  );
}
