"use client";

import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { auth } from '../../src/firebase';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import app from '../../src/firebase';
import { createFollowNotification } from '../utils/notifications';
import { toast } from 'react-hot-toast';

const db = getFirestore(app);

interface FollowersFollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialTab?: 'followers' | 'following';
}

interface UserData {
  id: string;
  displayName: string;
  email: string;
  role?: string;
  profilePicture?: string;
}

export default function FollowersFollowingModal({ 
  isOpen, 
  onClose, 
  userId, 
  initialTab = 'followers' 
}: FollowersFollowingModalProps) {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [followers, setFollowers] = useState<UserData[]>([]);
  const [following, setFollowing] = useState<UserData[]>([]);
  const [currentUserFollowing, setCurrentUserFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      loadData();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get target user's data
      const targetUserDoc = await getDoc(doc(db, 'users', userId));
      if (!targetUserDoc.exists()) return;

      const targetUserData = targetUserDoc.data();
      const followerIds = targetUserData.followers || [];
      const followingIds = targetUserData.following || [];

      // Get current user's following list
      if (user) {
        const currentUserDoc = await getDoc(doc(db, 'users', user.uid));
        if (currentUserDoc.exists()) {
          setCurrentUserFollowing(currentUserDoc.data().following || []);
        }
      }

      // Load followers data
      const followersData = await Promise.all(
        followerIds.map(async (id: string) => {
          const userDoc = await getDoc(doc(db, 'users', id));
          if (userDoc.exists()) {
            return { id, ...userDoc.data() } as UserData;
          }
          return null;
        })
      );
      setFollowers(followersData.filter(Boolean) as UserData[]);

      // Load following data
      const followingData = await Promise.all(
        followingIds.map(async (id: string) => {
          const userDoc = await getDoc(doc(db, 'users', id));
          if (userDoc.exists()) {
            return { id, ...userDoc.data() } as UserData;
          }
          return null;
        })
      );
      setFollowing(followingData.filter(Boolean) as UserData[]);

    } catch (error) {
      console.error('Error loading followers/following:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if (!user || targetUserId === user.uid) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const targetUserRef = doc(db, 'users', targetUserId);

      const isFollowing = currentUserFollowing.includes(targetUserId);

      if (isFollowing) {
        // Unfollow
        await updateDoc(userRef, {
          following: arrayRemove(targetUserId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayRemove(user.uid)
        });
        setCurrentUserFollowing(prev => prev.filter(id => id !== targetUserId));
        toast.success('Unfollowed successfully');
      } else {
        // Follow
        await updateDoc(userRef, {
          following: arrayUnion(targetUserId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayUnion(user.uid)
        });
        setCurrentUserFollowing(prev => [...prev, targetUserId]);
        toast.success('Following successfully');

        // Create follow notification
        await createFollowNotification(targetUserId, user.uid);
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      toast.error('Failed to update follow status');
    }
  };

  const handleUserClick = (clickedUserId: string) => {
    onClose();
    router.push(`/user/${clickedUserId}`);
  };

  if (!isOpen) return null;

  const currentList = activeTab === 'followers' ? followers : following;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {activeTab === 'followers' ? 'Followers' : 'Following'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'followers'
                ? 'text-teal-500 border-b-2 border-teal-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Followers ({followers.length})
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'following'
                ? 'text-teal-500 border-b-2 border-teal-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Following ({following.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
            </div>
          ) : currentList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>
                {activeTab === 'followers' 
                  ? 'No followers yet' 
                  : 'Not following anyone yet'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentList.map((userData) => (
                <div key={userData.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {userData.profilePicture ? (
                      <img
                        src={userData.profilePicture}
                        alt={userData.displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                        {userData.displayName?.[0] || userData.email?.[0] || 'U'}
                      </div>
                    )}
                    <div>
                      <button
                        onClick={() => handleUserClick(userData.id)}
                        className="font-medium text-gray-900 hover:text-teal-500 transition-colors text-left"
                      >
                        {userData.displayName || userData.email?.split('@')[0] || 'User'}
                      </button>
                      <div className="text-sm text-gray-600 capitalize">
                        {userData.role || 'Member'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Follow/Unfollow button - only show if not current user and user is logged in */}
                  {user && userData.id !== user.uid && (
                    <button
                      onClick={() => handleFollow(userData.id)}
                      className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                        currentUserFollowing.includes(userData.id)
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-teal-500 text-white hover:bg-teal-900'
                      }`}
                    >
                      {currentUserFollowing.includes(userData.id) ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

