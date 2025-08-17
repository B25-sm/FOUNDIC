"use client";

import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { auth } from '../../src/firebase';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, query, limit, orderBy } from 'firebase/firestore';
import app from '../../src/firebase';
import { createFollowNotification } from '../utils/notifications';

const db = getFirestore(app);

export default function WhoToFollow() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSuggestions = async () => {
      if (!user) return;

      try {
        // Get current user's following list
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const currentFollowing = userData.following || [];
        setFollowing(currentFollowing);

        // Get all users (limit to 10 for performance)
        const usersQuery = query(collection(db, 'users'), limit(10));
        const usersSnapshot = await getDocs(usersQuery);
        
        const allUsers = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(u => u.id !== user.uid && !currentFollowing.includes(u.id))
          .slice(0, 5); // Show max 5 suggestions

        setSuggestions(allUsers);
      } catch (error) {
        console.error('Error loading suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSuggestions();
  }, [user]);

  const handleFollow = async (userId: string) => {
    if (!user || userId === user.uid) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const targetUserRef = doc(db, 'users', userId);

      const isFollowing = following.includes(userId);

      if (isFollowing) {
        // Unfollow
        await updateDoc(userRef, {
          following: arrayRemove(userId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayRemove(user.uid)
        });
        setFollowing(prev => prev.filter(id => id !== userId));
      } else {
        // Follow
        await updateDoc(userRef, {
          following: arrayUnion(userId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayUnion(user.uid)
        });
        setFollowing(prev => [...prev, userId]);
        
        // Create follow notification
        await createFollowNotification(userId, user.uid);
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
    }
  };

  const handleUserClick = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  if (loading) {
    return (
      <div className="card p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Who to Follow</h3>
        <div className="text-gray-600 text-center py-4">Loading...</div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="card p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Who to Follow</h3>
        <div className="text-gray-600 text-center py-4">No suggestions available</div>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Who to Follow</h3>
        <button
          onClick={async () => {
            if (!user) return;
            try {
              const response = await fetch('/api/test-follow-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid, followerId: 'test-follower-id' })
              });
              const result = await response.json();
              console.log('Test follow notification created:', result);
            } catch (error) {
              console.error('Error creating test follow notification:', error);
            }
          }}
          className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
        >
          Test Follow
        </button>
      </div>
      <div className="space-y-3">
        {suggestions.map(suggestion => (
          <div key={suggestion.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {suggestion.displayName?.[0] || suggestion.email?.[0] || 'U'}
              </div>
              <div>
                <button
                  onClick={() => handleUserClick(suggestion.id)}
                  className="font-medium text-gray-900 text-sm hover:text-teal-500 transition-colors text-left"
                >
                  {suggestion.displayName || suggestion.email?.split('@')[0] || 'User'}
                </button>
                <div className="text-xs text-gray-600 capitalize">
                  {suggestion.role || 'Member'}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleFollow(suggestion.id)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                following.includes(suggestion.id)
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-teal-500 text-white hover:bg-teal-600'
              }`}
            >
              {following.includes(suggestion.id) ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
