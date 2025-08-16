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
        } else {
          toast.error('User not found');
          router.push('/wall');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user profile');
        router.push('/wall');
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
  }, [userId, user, router]);

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

  // Image upload functions
  const uploadProfilePicture = async (file: File) => {
    if (!user || user.uid !== userId) return;
    
    setUploadingProfilePic(true);
    try {
      // Since CORS is blocking Firebase Storage from localhost, use base64
      const base64String = await convertImageToBase64(file);
      
      // Update user document with base64 image
      await updateDoc(doc(db, 'users', userId), {
        profilePicture: base64String
      });
      
      // Update local state
      setUserData(prev => prev ? { ...prev, profilePicture: base64String } : null);
      
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploadingProfilePic(false);
    }
  };

  const uploadCoverPhoto = async (file: File) => {
    if (!user || user.uid !== userId) return;
    
    setUploadingCoverPhoto(true);
    try {
      // Since CORS is blocking Firebase Storage from localhost, use base64
      const base64String = await convertImageToBase64(file);
      
      // Update user document with base64 image
      await updateDoc(doc(db, 'users', userId), {
        coverPhoto: base64String
      });
      
      // Update local state
      setUserData(prev => prev ? { ...prev, coverPhoto: base64String } : null);
      
      toast.success('Cover photo updated successfully!');
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      toast.error('Failed to upload cover photo');
    } finally {
      setUploadingCoverPhoto(false);
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      uploadProfilePicture(file);
    }
  };

  const handleCoverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      uploadCoverPhoto(file);
    }
  };

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

  const handleSavePost = async (post: UserPost) => {
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const savedPosts = userData?.savedPosts || [];
      
      if (savedPosts.includes(post.id)) {
        // Remove from saved
        await updateDoc(userRef, {
          savedPosts: arrayRemove(post.id)
        });
        toast.success('Post removed from saved');
      } else {
        // Add to saved
        await updateDoc(userRef, {
          savedPosts: arrayUnion(post.id)
        });
        toast.success('Post saved successfully');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('Failed to save post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'posts', postId));
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleLike = async (post: UserPost) => {
    if (!user) return;
    const ref = doc(db, 'posts', post.id);
    const liked = post.likes?.includes(user.uid);
    await updateDoc(ref, {
      likes: liked ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });
  };

  const handleComment = async (post: UserPost) => {
    if (!user || !commentText.trim()) return;
    
    try {
      const commentData = {
        author: user.displayName || user.email || 'You',
        authorId: user.uid,
        content: commentText.trim(),
        createdAt: Timestamp.now(),
      };

      const postRef = doc(db, 'posts', post.id);
      const currentComments = post.comments || [];
      
      await updateDoc(postRef, {
        comments: [...currentComments, commentData]
      });

      setCommentText('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const getPostTypeIcon = (type: string) => {
    const icons: { [key: string]: JSX.Element } = {
      general: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      milestone: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      lesson: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      question: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      opportunity: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      celebration: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      fail: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      investor: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      job: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
        </svg>
      ),
    };
    return icons[type] || icons.general;
  };

  if (loading) {
    return (
      <AuthGuard>
        <main className="min-h-screen bg-white text-gray-900">
          <div className="text-gray-600 text-center py-8">Loading profile...</div>
        </main>
      </AuthGuard>
    );
  }

  if (!userData) {
    return (
      <AuthGuard>
        <main className="min-h-screen bg-white text-gray-900">
          <div className="text-gray-600 text-center py-8">User not found</div>
        </main>
      </AuthGuard>
    );
  }

  const isOwnProfile = user && user.uid === userId;

  return (
    <AuthGuard>
      <main className="min-h-screen bg-white text-gray-900">
        {/* Header Banner */}
        <div className="relative h-64 bg-gradient-to-br from-gold-950/20 to-gray-100">
          {/* Cover Photo */}
          {userData?.coverPhoto && (
            <img
              src={userData.coverPhoto}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Cover Photo Upload Button (only for own profile) */}
          {isOwnProfile && (
            <div className="absolute inset-0 flex items-center justify-center">
              <label className="cursor-pointer">
                <input
                  ref={coverPhotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverPhotoChange}
                  className="hidden"
                  disabled={uploadingCoverPhoto}
                />
                <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm hover:bg-black/70 transition-colors">
                  {uploadingCoverPhoto ? 'Uploading...' : 'Upload Cover Photo'}
                </div>
              </label>
            </div>
          )}
          
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 z-10 w-10 h-10 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors"
          >
            ←
          </button>
          

        </div>

        {/* Profile Section */}
        <div className="relative px-4 -mt-16">
          {/* Profile Picture */}
          <div className="relative inline-block">
            {userData?.profilePicture ? (
              <img
                src={userData.profilePicture}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 bg-gold-950 rounded-full flex items-center justify-center text-white font-bold text-4xl border-4 border-white shadow-lg">
                {userData?.displayName?.[0] || userData?.email?.[0] || 'U'}
              </div>
            )}
            
            {/* Profile Picture Upload Button (only for own profile) */}
            {isOwnProfile && (
              <label className="absolute bottom-0 right-0 cursor-pointer z-10">
                <input
                  ref={profilePicInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicChange}
                  className="hidden"
                  disabled={uploadingProfilePic}
                />
                <div className="w-8 h-8 bg-gold-950 rounded-full flex items-center justify-center text-white text-sm hover:bg-gold-900 transition-colors shadow-lg">
                  {uploadingProfilePic ? '...' : '📷'}
                </div>
              </label>
            )}
            
            {/* Online Status Dot */}
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white z-5"></div>
          </div>

          {/* User Info */}
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {userData?.displayName || userData?.email}
            </h1>
            <p className="text-gray-600 text-sm">
              {userData?.location && `${userData.location}, `}
              {userData?.position && `${userData.position}, `}
              {userData?.company && `${userData.company}, `}
              {userData?.role && `${userData.role}`}
            </p>
          </div>

          {/* Stats */}
          <div className="flex justify-around mt-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{userPosts.length}</div>
              <div className="text-sm text-gray-600">POSTS</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{userData?.followers?.length || 0}</div>
              <div className="text-sm text-gray-600">FOLLOWERS</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{userData?.following?.length || 0}</div>
              <div className="text-sm text-gray-600">FOLLOWING</div>
            </div>
          </div>

          {/* Action Buttons */}
          {user && user.uid !== userId && (
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleFollow}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                  following
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-gold-950 text-white hover:bg-gold-900'
                }`}
              >
                {following ? 'FOLLOWING' : 'FOLLOW'}
              </button>
              <button
                onClick={() => setShowChatModal(true)}
                className="flex-1 py-3 px-6 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                MESSAGE
              </button>
            </div>
          )}

          {/* Bio Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
            {userData?.bio ? (
              <p className="text-gray-700">{userData.bio}</p>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-gray-600 mb-3">Tell others about yourself</p>
                {isOwnProfile && (
                  <button
                    onClick={() => router.push('/profile/edit')}
                    className="px-4 py-2 bg-gold-950 text-white rounded-lg hover:bg-gold-900 transition-colors"
                  >
                    Add Bio
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Professional Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional</h3>
            {(userData?.company || userData?.position || userData?.industry) ? (
              <div className="space-y-2">
                {userData.position && userData.company && (
                  <div className="text-gray-700">
                    <div className="font-medium">{userData.position}</div>
                    <div className="text-gray-600">{userData.company}</div>
                  </div>
                )}
                {userData.industry && (
                  <div className="text-gray-700">
                    <span className="text-gray-600">Industry:</span> {userData.industry}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
                <p className="text-gray-600 mb-3">Add your professional information</p>
                {isOwnProfile && (
                  <button
                    onClick={() => router.push('/profile/edit')}
                    className="px-4 py-2 bg-gold-950 text-white rounded-lg hover:bg-gold-900 transition-colors"
                  >
                    Add Professional Info
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills</h3>
            {userData?.skills && userData.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gold-950/10 text-gold-950 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-gray-600 mb-3">Showcase your skills</p>
                {isOwnProfile && (
                  <button
                    onClick={() => router.push('/profile/edit')}
                    className="px-4 py-2 bg-gold-950 text-white rounded-lg hover:bg-gold-900 transition-colors"
                  >
                    Add Skills
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Social Links */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Connect & Links</h3>
            {(userData?.linkedin || userData?.twitter || userData?.github || userData?.instagram || userData?.website || userData?.portfolio || userData?.resume || userData?.whatsapp) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {userData?.linkedin && (
                  <a
                    href={userData.linkedin.startsWith('http') ? userData.linkedin : `https://linkedin.com/in/${userData.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                  >
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span className="text-blue-600 font-medium group-hover:underline">LinkedIn</span>
                  </a>
                )}

                {userData?.twitter && (
                  <a
                    href={userData.twitter.startsWith('http') ? userData.twitter : `https://twitter.com/${userData.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors group"
                  >
                    <svg className="w-5 h-5 text-sky-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    <span className="text-sky-500 font-medium group-hover:underline">Twitter/X</span>
                  </a>
                )}

                {userData?.github && (
                  <a
                    href={userData.github.startsWith('http') ? userData.github : `https://github.com/${userData.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <span className="text-gray-700 font-medium group-hover:underline">GitHub</span>
                  </a>
                )}

                {userData?.instagram && (
                  <a
                    href={userData.instagram.startsWith('http') ? userData.instagram : `https://instagram.com/${userData.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors group"
                  >
                    <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.781c-.49 0-.928-.175-1.297-.49-.368-.315-.49-.753-.49-1.243 0-.49.122-.928.49-1.243.369-.315.807-.49 1.297-.49s.928.175 1.297.49c.368.315.49.753.49 1.243 0 .49-.122.928-.49 1.243-.369.315-.807.49-1.297.49zm-7.83 9.781c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.781c-.49 0-.928-.175-1.297-.49-.368-.315-.49-.753-.49-1.243 0-.49.122-.928.49-1.243.369-.315.807-.49 1.297-.49s.928.175 1.297.49c.368.315.49.753.49 1.243 0 .49-.122.928-.49 1.243-.369.315-.807.49-1.297.49z"/>
                    </svg>
                    <span className="text-pink-600 font-medium group-hover:underline">Instagram</span>
                  </a>
                )}

                {userData?.website && (
                  <a
                    href={userData.website.startsWith('http') ? userData.website : `https://${userData.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                  >
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <span className="text-green-600 font-medium group-hover:underline">Website</span>
                  </a>
                )}

                {userData?.portfolio && (
                  <a
                    href={userData.portfolio.startsWith('http') ? userData.portfolio : `https://${userData.portfolio}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
                  >
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="text-purple-600 font-medium group-hover:underline">Portfolio</span>
                  </a>
                )}

                {userData?.resume && (
                  <a
                    href={userData.resume.startsWith('http') ? userData.resume : `https://${userData.resume}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group"
                  >
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-orange-600 font-medium group-hover:underline">Resume</span>
                  </a>
                )}

                {userData?.whatsapp && (
                  <a
                    href={`https://wa.me/${userData.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                  >
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    <span className="text-green-600 font-medium group-hover:underline">WhatsApp</span>
                  </a>
                )}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <p className="text-gray-600 mb-3">Connect with others through your social links</p>
                {isOwnProfile && (
                  <button
                    onClick={() => router.push('/profile/edit')}
                    className="px-4 py-2 bg-gold-950 text-white rounded-lg hover:bg-gold-900 transition-colors"
                  >
                    Add Social Links
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Education & Experience */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Background</h3>
            {(userData?.education || userData?.experience) ? (
              <div className="space-y-4">
                {userData?.education && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Education</h4>
                    <p className="text-gray-700">{userData.education}</p>
                  </div>
                )}
                {userData?.experience && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Experience Level</h4>
                    <p className="text-gray-700 capitalize">{userData.experience}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className="text-gray-600 mb-3">Share your education and experience</p>
                {isOwnProfile && (
                  <button
                    onClick={() => router.push('/profile/edit')}
                    className="px-4 py-2 bg-gold-950 text-white rounded-lg hover:bg-gold-900 transition-colors"
                  >
                    Add Background
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Location */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
            {userData?.location ? (
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{userData.location}</span>
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-gray-600 mb-3">Let others know where you're located</p>
                {isOwnProfile && (
                  <button
                    onClick={() => router.push('/profile/edit')}
                    className="px-4 py-2 bg-gold-950 text-white rounded-lg hover:bg-gold-900 transition-colors"
                  >
                    Add Location
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Recent Posts Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Recent Posts</h2>
            </div>
            
            {userPosts.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <p>No posts yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userPosts.slice(0, 4).map((post) => (
                  <div key={post.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    {/* Post Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{getPostTypeIcon(post.type)}</span>
                        <span className="text-xs text-gray-500 capitalize">{post.type}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {post.createdAt?.toDate ? 
                          post.createdAt.toDate().toLocaleDateString() : 
                          'Recently'
                        }
                      </span>
                    </div>
                    
                    {/* Post Content */}
                    {post.content && (
                      <div className="text-gray-800 text-sm mb-3 leading-relaxed">
                        {post.content}
                      </div>
                    )}
                    
                                         {/* Post Images */}
                     {post.images && post.images.length > 0 && (
                       <div className="mb-3">
                         <div className={`grid gap-2 ${
                           post.images.length === 1 ? 'grid-cols-1' :
                           post.images.length === 2 ? 'grid-cols-2' :
                           post.images.length === 3 ? 'grid-cols-3' :
                           'grid-cols-2 sm:grid-cols-4'
                         }`}>
                           {post.images.map((imageUrl, index) => (
                             <div key={index} className="relative">
                               <img
                                 src={imageUrl}
                                 alt={`Post image ${index + 1}`}
                                 className="w-full aspect-square object-cover rounded-lg"
                               />
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                    
                                         {/* Post Stats */}
                     <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                       <div className="flex items-center gap-1">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                         </svg>
                         <span>{post.likes?.length || 0}</span>
                       </div>
                       <div className="flex items-center gap-1">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                         </svg>
                         <span>{post.comments?.length || 0}</span>
                       </div>
                       {/* Save Button */}
                       <button
                         className={`flex items-center gap-1 transition-colors ${
                           userData?.savedPosts?.includes(post.id) 
                             ? 'text-gold-950' 
                             : 'text-gray-500 hover:text-gold-950'
                         }`}
                         onClick={() => handleSavePost(post)}
                         title={userData?.savedPosts?.includes(post.id) ? 'Remove from saved' : 'Save post'}
                       >
                         <svg className="w-4 h-4" fill={userData?.savedPosts?.includes(post.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                         </svg>
                         <span>{userData?.savedPosts?.includes(post.id) ? 'Saved' : 'Save'}</span>
                       </button>
                                               {/* Like Button */}
                        <button
                          className={`flex items-center gap-1 transition-colors ${
                            post.likes?.includes(user?.uid)
                              ? 'text-gold-950'
                              : 'text-gray-500 hover:text-gold-950'
                          }`}
                          onClick={() => handleLike(post)}
                          title={post.likes?.includes(user?.uid) ? 'Unlike' : 'Like'}
                        >
                          <svg className="w-4 h-4" fill={post.likes?.includes(user?.uid) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span>{post.likes?.length || 0}</span>
                        </button>
                       {/* Comment Button */}
                       <button
                         className="flex items-center gap-1 text-gray-500 hover:text-gold-950 transition-colors"
                         onClick={() => setCommentPost(post)}
                         title="Comment"
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                         </svg>
                         <span>{post.comments?.length || 0}</span>
                       </button>
                       {/* Delete Button (only for own posts) */}
                       {user && post.authorId === user.uid && (
                         <button
                           className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors"
                           onClick={() => handleDeletePost(post.id)}
                           title="Delete post"
                         >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                           </svg>
                           <span>Delete</span>
                         </button>
                       )}
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bio Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
            {userData?.bio ? (
              <p className="text-gray-700">{userData.bio}</p>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-gray-600 mb-3">Tell others about yourself</p>
                {isOwnProfile && (
                  <button
                    onClick={() => router.push('/profile/edit')}
                    className="px-4 py-2 bg-gold-950 text-white rounded-lg hover:bg-gold-900 transition-colors"
                  >
                    Add Bio
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Professional Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional</h3>
            {(userData?.company || userData?.position || userData?.industry) ? (
              <div className="space-y-2">
                {userData.position && userData.company && (
                  <div className="text-gray-700">
                    <div className="font-medium">{userData.position}</div>
                    <div className="text-gray-600">{userData.company}</div>
                  </div>
                )}
                {userData.industry && (
                  <div className="text-gray-700">
                    <span className="text-gray-600">Industry:</span> {userData.industry}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
                <p className="text-gray-600 mb-3">Add your professional information</p>
                {isOwnProfile && (
                  <button
                    onClick={() => router.push('/profile/edit')}
                    className="px-4 py-2 bg-gold-950 text-white rounded-lg hover:bg-gold-900 transition-colors"
                  >
                    Add Professional Info
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills</h3>
            {userData?.skills && userData.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gold-950/10 text-gold-950 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-gray-600 mb-3">Showcase your skills</p>
                {isOwnProfile && (
                  <button
                    onClick={() => router.push('/profile/edit')}
                    className="px-4 py-2 bg-gold-950 text-white rounded-lg hover:bg-gold-900 transition-colors"
                  >
                    Add Skills
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Social Links */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Connect & Links</h3>
            {(userData?.linkedin || userData?.twitter || userData?.github || userData?.instagram || userData?.website || userData?.portfolio || userData?.resume || userData?.whatsapp) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {userData?.linkedin && (
                  <a
                    href={userData.linkedin.startsWith('http') ? userData.linkedin : `https://linkedin.com/in/${userData.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                  >
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span className="text-blue-600 font-medium group-hover:underline">LinkedIn</span>
                  </a>
                )}

                {userData?.twitter && (
                  <a
                    href={userData.twitter.startsWith('http') ? userData.twitter : `https://twitter.com/${userData.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors group"
                  >
                    <svg className="w-5 h-5 text-sky-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    <span className="text-sky-500 font-medium group-hover:underline">Twitter/X</span>
                  </a>
                )}

                {userData?.github && (
                  <a
                    href={userData.github.startsWith('http') ? userData.github : `https://github.com/${userData.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <span className="text-gray-700 font-medium group-hover:underline">GitHub</span>
                  </a>
                )}

                {userData?.instagram && (
                  <a
                    href={userData.instagram.startsWith('http') ? userData.instagram : `https://instagram.com/${userData.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors group"
                  >
                    <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.781c-.49 0-.928-.175-1.297-.49-.368-.315-.49-.753-.49-1.243 0-.49.122-.928.49-1.243.369-.315.807-.49 1.297-.49s.928.175 1.297.49c.368.315.49.753.49 1.243 0 .49-.122.928-.49 1.243-.369.315-.807.49-1.297.49zm-7.83 9.781c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.781c-.49 0-.928-.175-1.297-.49-.368-.315-.49-.753-.49-1.243 0-.49.122-.928.49-1.243.369-.315.807-.49 1.297-.49s.928.175 1.297.49c.368.315.49.753.49 1.243 0 .49-.122.928-.49 1.243-.369.315-.807.49-1.297.49z"/>
                    </svg>
                    <span className="text-pink-600 font-medium group-hover:underline">Instagram</span>
                  </a>
                )}

                {userData?.website && (
                  <a
                    href={userData.website.startsWith('http') ? userData.website : `https://${userData.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                  >
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                    </svg>
                    <span className="text-green-600 font-medium group-hover:underline">Website</span>
                  </a>
                )}

                {userData?.portfolio && (
                  <a
                    href={userData.portfolio.startsWith('http') ? userData.portfolio : `https://${userData.portfolio}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
                  >
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="text-purple-600 font-medium group-hover:underline">Portfolio</span>
                  </a>
                )}

                {userData?.resume && (
                  <a
                    href={userData.resume.startsWith('http') ? userData.resume : `https://${userData.resume}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group"
                  >
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-orange-600 font-medium group-hover:underline">Resume</span>
                  </a>
                )}

                {userData?.whatsapp && (
                  <a
                    href={`https://wa.me/${userData.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                  >
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    <span className="text-green-600 font-medium group-hover:underline">WhatsApp</span>
                  </a>
                )}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <p className="text-gray-600 mb-3">Connect with others through your social links</p>
                {isOwnProfile && (
                  <button
                    onClick={() => router.push('/profile/edit')}
                    className="px-4 py-2 bg-gold-950 text-white rounded-lg hover:bg-gold-900 transition-colors"
                  >
                    Add Social Links
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Education & Experience */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Background</h3>
            {(userData?.education || userData?.experience) ? (
              <div className="space-y-4">
                {userData?.education && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Education</h4>
                    <p className="text-gray-700">{userData.education}</p>
                  </div>
                )}
                {userData?.experience && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Experience Level</h4>
                    <p className="text-gray-700 capitalize">{userData.experience}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className="text-gray-600 mb-3">Share your education and experience</p>
                {isOwnProfile && (
                  <button
                    onClick={() => router.push('/profile/edit')}
                    className="px-4 py-2 bg-gold-950 text-white rounded-lg hover:bg-gold-900 transition-colors"
                  >
                    Add Background
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Location */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
            {userData?.location ? (
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{userData.location}</span>
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-gray-600 mb-3">Let others know where you're located</p>
                {isOwnProfile && (
                  <button
                    onClick={() => router.push('/profile/edit')}
                    className="px-4 py-2 bg-gold-950 text-white rounded-lg hover:bg-gold-900 transition-colors"
                  >
                    Add Location
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chat Modal */}
        {showChatModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {userData?.profilePicture ? (
                    <img
                      src={userData.profilePicture}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover border border-gold-950"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gold-950 rounded-full flex items-center justify-center text-white font-bold">
                      {userData?.displayName?.[0] || userData?.email?.[0] || 'U'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {userData?.displayName || userData?.email}
                    </h3>
                    <p className="text-xs text-gray-600 capitalize">
                      {userData?.role || 'Member'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChatModal(false)}
                  className="text-gray-600 hover:text-gray-900 text-xl"
                >
                  ✕
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-600 py-8">
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
                            ? 'bg-gold-950 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="text-sm font-medium mb-1">
                          {message.senderId === user?.uid ? 'You' : userData?.displayName || userData?.email}
                        </div>
                        <div className="text-sm">{message.content}</div>
                        <div className={`text-xs mt-1 ${
                          message.senderId === user?.uid ? 'text-gold-200' : 'text-gray-600'
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
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-950"
                    disabled={sendingMessage}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!chatMessage.trim() || sendingMessage}
                    className="px-4 py-2 bg-gold-950 text-white rounded-lg hover:bg-gold-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sendingMessage ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comment Modal */}
        {commentPost && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] flex flex-col">
              {/* Comment Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Comments</h3>
                <button
                  onClick={() => setCommentPost(null)}
                  className="text-gray-600 hover:text-gray-900 text-xl"
                >
                  ✕
                </button>
              </div>

              {/* Comments Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
                {commentPost.comments && commentPost.comments.length > 0 ? (
                  commentPost.comments.map((comment, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {comment.author || 'User'}
                      </div>
                      <div className="text-sm text-gray-700">{comment.content}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {comment.createdAt?.toDate ? 
                          comment.createdAt.toDate().toLocaleDateString() : 
                          'Recently'
                        }
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-600 py-8">
                    <div className="text-2xl mb-2">💬</div>
                    <p className="text-sm">No comments yet</p>
                    <p className="text-xs">Be the first to comment!</p>
                  </div>
                )}
              </div>

              {/* Comment Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleComment(commentPost);
                      }
                    }}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-950"
                  />
                  <button
                    onClick={() => handleComment(commentPost)}
                    disabled={!commentText.trim()}
                    className="px-4 py-2 bg-gold-950 text-white rounded-lg hover:bg-gold-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
