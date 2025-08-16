"use client";

import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../src/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import AuthGuard from '../components/AuthGuard';

interface UserStats {
  followers: number;
  following: number;
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  postsLiked: number;
  opportunitiesPosted: number;
  opportunitiesApplied: number;
}

interface UserPost {
  id: string;
  content: string;
  type: string;
  likes: string[];
  comments: any[];
  createdAt: any;
  authorId: string;
}

export default function ProfilePage() {
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState<any>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    followers: 0,
    following: 0,
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    postsLiked: 0,
    opportunitiesPosted: 0,
    opportunitiesApplied: 0
  });
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'activity'>('overview');

  useEffect(() => {
    if (user) {
      setLoading(true);
      
      // Set up real-time listeners
      const unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setUserData(data);
          setUserStats(prev => ({
            ...prev,
            followers: data.followers?.length || 0,
            following: data.following?.length || 0
          }));
          setLoading(false);
        }
      });

      // Real-time listener for user's posts (simplified query)
      const postsQuery = query(
        collection(db, 'posts'),
        where('authorId', '==', user.uid)
      );
      const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
        const posts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserPost[];
        
        // Sort posts by createdAt manually to avoid index requirement
        posts.sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return bTime - aTime;
        });
        
        setUserPosts(posts);
        setUserStats(prev => ({
          ...prev,
          totalPosts: posts.length,
          opportunitiesPosted: posts.filter(post => post.type === 'opportunity').length
        }));

        // Calculate likes and comments from posts
        let totalLikes = 0;
        let totalComments = 0;
        posts.forEach(post => {
          totalLikes += post.likes?.length || 0;
          totalComments += post.comments?.length || 0;
        });

        setUserStats(prev => ({
          ...prev,
          totalLikes,
          totalComments
        }));
      });

      // Real-time listener for all posts to track posts liked (simplified)
      const allPostsQuery = query(collection(db, 'posts'));
      const unsubscribeAllPosts = onSnapshot(allPostsQuery, (snapshot) => {
        const allPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserPost[];
        
        const postsLiked = allPosts.filter(post => 
          post.likes?.includes(user.uid)
        ).length;

        setUserStats(prev => ({
          ...prev,
          postsLiked
        }));
      });

      // Cleanup listeners on unmount
      return () => {
        unsubscribeUser();
        unsubscribePosts();
        unsubscribeAllPosts();
      };
    }
  }, [user]);

  // Calculate engagement metrics
  const avgLikesPerPost = userStats.totalPosts > 0 ? (userStats.totalLikes / userStats.totalPosts).toFixed(1) : '0';
  const avgCommentsPerPost = userStats.totalPosts > 0 ? (userStats.totalComments / userStats.totalPosts).toFixed(1) : '0';
  const engagementRate = userStats.totalPosts > 0 ? 
    (((userStats.totalLikes + userStats.totalComments) / userStats.totalPosts) * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <AuthGuard>
        <main className="min-h-screen bg-midnight-950 text-support px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-support/60 text-center py-8">Loading profile...</div>
          </div>
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-midnight-950 text-support px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="card p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
              {userData?.profilePicture ? (
                <img
                  src={userData.profilePicture}
                  alt="Profile"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-gold-950 mx-auto sm:mx-0"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gold-950 rounded-full flex items-center justify-center text-midnight-950 font-bold text-2xl sm:text-3xl mx-auto sm:mx-0">
                  {userData?.displayName?.[0] || user?.email?.[0] || 'U'}
                </div>
              )}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-support mb-2">
                  {userData?.displayName || user?.email?.split('@')[0] || 'User'}
                </h1>
                <p className="text-support/60 capitalize mb-2 text-sm sm:text-base">
                  {userData?.role || 'Member'}
                </p>
                <p className="text-support/80 text-sm sm:text-base">
                  {user?.email}
                </p>
                {userData?.location && (
                  <p className="text-support/60 text-sm sm:text-base">
                    📍 {userData.location}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3">
                  <span className="text-gold-950 font-bold text-sm sm:text-base">{userData?.fCoins || 0} F-Coins</span>
                  <span className="text-support/60 hidden sm:block">•</span>
                  <span className="text-support/60 text-sm sm:text-base">Member since {userData?.createdAt?.toDate ? 
                    userData.createdAt.toDate().toLocaleDateString() : 'Recently'}</span>
                </div>
                <div className="mt-3">
                  <a
                    href="/profile/edit"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gold-950 text-midnight-950 rounded-lg hover:bg-gold-900 transition-colors text-sm font-medium"
                  >
                    ✏️ Edit Profile
                  </a>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-midnight-800 rounded-lg">
                <div className="text-lg sm:text-xl font-bold text-gold-950">{userStats.followers}</div>
                <div className="text-xs sm:text-sm text-support/60">Followers</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-midnight-800 rounded-lg">
                <div className="text-lg sm:text-xl font-bold text-gold-950">{userStats.following}</div>
                <div className="text-xs sm:text-sm text-support/60">Following</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-midnight-800 rounded-lg">
                <div className="text-lg sm:text-xl font-bold text-gold-950">{userStats.totalPosts}</div>
                <div className="text-xs sm:text-sm text-support/60">Posts</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-midnight-800 rounded-lg">
                <div className="text-lg sm:text-xl font-bold text-gold-950">{userStats.totalLikes}</div>
                <div className="text-xs sm:text-sm text-support/60">Likes Received</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-midnight-800 rounded-lg">
                <div className="text-lg sm:text-xl font-bold text-gold-950">{userStats.totalComments}</div>
                <div className="text-xs sm:text-sm text-support/60">Comments</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-midnight-800 rounded-lg">
                <div className="text-lg sm:text-xl font-bold text-gold-950">{userStats.postsLiked}</div>
                <div className="text-xs sm:text-sm text-support/60">Posts Liked</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-midnight-800 rounded-lg">
                <div className="text-lg sm:text-xl font-bold text-gold-950">{userStats.opportunitiesPosted}</div>
                <div className="text-xs sm:text-sm text-support/60">Opportunities Posted</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-midnight-800 rounded-lg">
                <div className="text-lg sm:text-xl font-bold text-gold-950">{userStats.opportunitiesApplied}</div>
                <div className="text-xs sm:text-sm text-support/60">Opportunities Applied</div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-6 sm:mb-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'overview' ? 'bg-gold-950 text-midnight-950' : 'bg-midnight-800 text-support hover:bg-midnight-700'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'posts' ? 'bg-gold-950 text-midnight-950' : 'bg-midnight-800 text-support hover:bg-midnight-700'
              }`}
            >
              📝 My Posts ({userPosts.length})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'activity' ? 'bg-gold-950 text-midnight-950' : 'bg-midnight-800 text-support hover:bg-midnight-700'
              }`}
            >
              🔴 Activity
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="card p-4 sm:p-6 lg:p-8">
              <h2 className="text-xl font-bold text-support mb-6">Engagement Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-midnight-800 rounded-lg">
                  <div className="text-2xl font-bold text-gold-950">{avgLikesPerPost}</div>
                  <div className="text-sm text-support/60">Avg. Likes per Post</div>
                </div>
                <div className="text-center p-4 bg-midnight-800 rounded-lg">
                  <div className="text-2xl font-bold text-gold-950">{avgCommentsPerPost}</div>
                  <div className="text-sm text-support/60">Avg. Comments per Post</div>
                </div>
                <div className="text-center p-4 bg-midnight-800 rounded-lg">
                  <div className="text-2xl font-bold text-gold-950">{engagementRate}%</div>
                  <div className="text-sm text-support/60">Engagement Rate</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-4">
              {userPosts.length === 0 ? (
                <div className="card p-8 text-center">
                  <div className="text-support/60 mb-4">No posts yet</div>
                  <p className="text-sm text-support/60">Start sharing your thoughts, milestones, and experiences!</p>
                </div>
              ) : (
                userPosts.map(post => (
                  <div key={post.id} className="card p-4 sm:p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-gold-950 rounded-full flex items-center justify-center text-midnight-950 font-bold">
                        {userData?.displayName?.[0] || user?.email?.[0] || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-support">{userData?.displayName || user?.email?.split('@')[0] || 'User'}</span>
                          <span className="text-xs text-support/60 capitalize">{userData?.role || 'Member'}</span>
                          <span className="text-sm">{getPostTypeIcon(post.type)}</span>
                          <span className="ml-auto text-xs text-support/60">
                            {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : 'now'}
                          </span>
                        </div>
                        <div className="text-support/90 text-sm sm:text-base">{post.content}</div>
                      </div>
                    </div>
                    <div className="flex gap-4 text-support/70 text-sm border-t border-midnight-800 pt-3">
                      <span>👍 {post.likes?.length || 0}</span>
                      <span>💬 {post.comments?.length || 0}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="card p-4 sm:p-6 lg:p-8">
              <h2 className="text-xl font-bold text-support mb-6">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-midnight-800 rounded-lg">
                  <div className="w-8 h-8 bg-gold-950 rounded-full flex items-center justify-center text-midnight-950 text-sm">📝</div>
                  <div className="flex-1">
                    <div className="text-sm text-support">Created {userStats.totalPosts} posts</div>
                    <div className="text-xs text-support/60">Your content creation activity</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-midnight-800 rounded-lg">
                  <div className="w-8 h-8 bg-gold-950 rounded-full flex items-center justify-center text-midnight-950 text-sm">👍</div>
                  <div className="flex-1">
                    <div className="text-sm text-support">Liked {userStats.postsLiked} posts</div>
                    <div className="text-xs text-support/60">Your engagement with others</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-midnight-800 rounded-lg">
                  <div className="w-8 h-8 bg-gold-950 rounded-full flex items-center justify-center text-midnight-950 text-sm">👥</div>
                  <div className="flex-1">
                    <div className="text-sm text-support">Following {userStats.following} users</div>
                    <div className="text-xs text-support/60">Your network connections</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-midnight-800 rounded-lg">
                  <div className="w-8 h-8 bg-gold-950 rounded-full flex items-center justify-center text-midnight-950 text-sm">💼</div>
                  <div className="flex-1">
                    <div className="text-sm text-support">Posted {userStats.opportunitiesPosted} opportunities</div>
                    <div className="text-xs text-support/60">Your opportunities</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}

function getPostTypeIcon(type: string): string {
  const icons: { [key: string]: string } = {
    general: '📝',
    milestone: '🎯',
    lesson: '💡',
    question: '❓',
    opportunity: '💼',
    celebration: '🎉',
    fail: '💪',
    investor: '💰',
    job: '💼'
  };
  return icons[type] || '📝';
}
