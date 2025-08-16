"use client";

import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../src/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import AuthGuard from '../components/AuthGuard';
import OnboardingModal from '../components/OnboardingModal';
import ValuationEstimator from '../components/ValuationEstimator';
import Leaderboard from '../components/Leaderboard';

interface UserStats {
  fCoins: number;
  dnaMatches: number;
  podsJoined: number;
  postsCreated: number;
  followers: number;
  following: number;
  likesReceived: number;
  commentsReceived: number;
  opportunitiesPosted: number;
  opportunitiesApplied: number;
}

export default function DashboardPage() {
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState<any>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    fCoins: 0,
    dnaMatches: 0,
    podsJoined: 0,
    postsCreated: 0,
    followers: 0,
    following: 0,
    likesReceived: 0,
    commentsReceived: 0,
    opportunitiesPosted: 0,
    opportunitiesApplied: 0
  });
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showValuation, setShowValuation] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        
        // Load user statistics
        await loadUserStats(user.uid);
        
        // Show onboarding for new users
        if (!data.onboardingCompleted) {
          setShowOnboarding(true);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async (userId: string) => {
    try {
      // Get posts count
      const postsQuery = query(collection(db, 'posts'), where('authorId', '==', userId));
      const postsSnapshot = await getDocs(postsQuery);
      const postsCount = postsSnapshot.size;

      // Get DNA matches count
      const matchesQuery = query(collection(db, 'dnaMatches'), where('userId', '==', userId));
      const matchesSnapshot = await getDocs(matchesQuery);
      const matchesCount = matchesSnapshot.size;

      // Get pods joined count
      const podsQuery = query(collection(db, 'pods'), where('members', 'array-contains', userId));
      const podsSnapshot = await getDocs(podsQuery);
      const podsCount = podsSnapshot.size;

          // Get opportunities posted count
    const opportunitiesQuery = query(collection(db, 'opportunities'), where('authorId', '==', userId));
    const opportunitiesSnapshot = await getDocs(opportunitiesQuery);
    const opportunitiesPosted = opportunitiesSnapshot.size;

    // Get user's applied opportunities count
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userAppliedOpportunities = userDoc.data()?.appliedOpportunities?.length || 0;

      setUserStats({
        fCoins: userData?.fCoins || 0,
        dnaMatches: matchesCount,
        podsJoined: podsCount,
        postsCreated: postsCount,
        followers: userData?.followers?.length || 0,
        following: userData?.following?.length || 0,
        likesReceived: userData?.totalLikesReceived || 0,
        commentsReceived: userData?.totalCommentsReceived || 0,
              opportunitiesPosted: opportunitiesPosted,
      opportunitiesApplied: userAppliedOpportunities
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <main className="min-h-screen bg-midnight-950 text-support px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-950 mx-auto mb-4"></div>
              <p className="text-support/60">Loading dashboard...</p>
            </div>
          </div>
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-midnight-950 text-support px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-2">Founder Compass</h1>
            <p className="text-support/60 text-sm sm:text-base">Track your startup journey and connect with the community</p>
          </div>

          {/* User Info Card */}
          <div className="card p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gold-950 rounded-full flex items-center justify-center text-midnight-950 font-bold text-xl sm:text-2xl">
                {user?.displayName?.[0] || user?.email?.[0] || 'U'}
              </div>
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-semibold text-support mb-1">
                  {user?.displayName || user?.email?.split('@')[0] || 'User'}
                </h2>
                <p className="text-support/60 text-sm sm:text-base capitalize mb-2">
                  {userData?.role || 'Member'} • Member since {user?.metadata?.creationTime ? 
                    new Date(user.metadata.creationTime).toLocaleDateString() : 'Recently'}
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-4 text-sm">
                  <span className="bg-gold-950/20 text-gold-950 px-2 sm:px-3 py-1 rounded-full font-medium">
                    {userStats.fCoins} F-Coins
                  </span>
                  <span className="bg-midnight-800 text-support px-2 sm:px-3 py-1 rounded-full">
                    {userStats.followers} Followers
                  </span>
                  <span className="bg-midnight-800 text-support px-2 sm:px-3 py-1 rounded-full">
                    {userStats.following} Following
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="card p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gold-950 mb-1">{userStats.fCoins}</div>
              <div className="text-xs sm:text-sm text-support/60">F-Coins</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-support mb-1">{userStats.dnaMatches}</div>
              <div className="text-xs sm:text-sm text-support/60">DNA Matches</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-support mb-1">{userStats.podsJoined}</div>
              <div className="text-xs sm:text-sm text-support/60">Pods Joined</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-support mb-1">{userStats.postsCreated}</div>
              <div className="text-xs sm:text-sm text-support/60">Posts</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-support mb-1">{userStats.likesReceived}</div>
              <div className="text-xs sm:text-sm text-support/60">Likes Received</div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* DNA Match */}
            <div className="card p-4 sm:p-6 hover:card-hover transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">🧬</div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-support">DNA Match</h3>
                  <p className="text-sm text-support/60">Find your perfect co-founder</p>
                </div>
              </div>
              <p className="text-sm text-support/80 mb-4">
                Take our comprehensive survey to find co-founders with complementary skills and shared vision.
              </p>
              <a href="/dna-match" className="btn-primary w-full text-center text-sm">
                Start Matching
              </a>
            </div>

            {/* Mission Pods */}
            <div className="card p-4 sm:p-6 hover:card-hover transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">🚀</div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-support">Mission Pods</h3>
                  <p className="text-sm text-support/60">60-day co-building sprints</p>
                </div>
              </div>
              <p className="text-sm text-support/80 mb-4">
                Join focused teams for 60-day sprints to build, validate, and launch your startup ideas.
              </p>
              <a href="/pods" className="btn-primary w-full text-center text-sm">
                Join Pods
              </a>
            </div>

            {/* Fail Forward Wall */}
            <div className="card p-4 sm:p-6 hover:card-hover transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">💪</div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-support">Fail Forward</h3>
                  <p className="text-sm text-support/60">Share lessons learned</p>
                </div>
              </div>
              <p className="text-sm text-support/80 mb-4">
                Share your failures and lessons learned. Help others avoid the same mistakes.
              </p>
              <a href="/wall" className="btn-primary w-full text-center text-sm">
                Share Story
              </a>
            </div>

            {/* Signal Boost */}
            <div className="card p-4 sm:p-6 hover:card-hover transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">📢</div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-support">Signal Boost</h3>
                  <p className="text-sm text-support/60">Share micro wins</p>
                </div>
              </div>
              <p className="text-sm text-support/80 mb-4">
                Celebrate small victories and milestones. Every step forward counts.
              </p>
              <a href="/wall" className="btn-primary w-full text-center text-sm">
                Boost Signal
              </a>
            </div>

            {/* Investor Connect */}
            <div className="card p-4 sm:p-6 hover:card-hover transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">💰</div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-support">Investor Connect</h3>
                  <p className="text-sm text-support/60">Connect with investors</p>
                </div>
              </div>
              <p className="text-sm text-support/80 mb-4">
                Get discovered by investors looking for promising startups to back.
              </p>
              <a href="/investors" className="btn-primary w-full text-center text-sm">
                Get Discovered
              </a>
            </div>

            {/* Opportunities Board */}
            <div className="card p-4 sm:p-6 hover:card-hover transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">💼</div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-support">Opportunities Board</h3>
                  <p className="text-sm text-support/60">Find opportunities</p>
                </div>
              </div>
              <p className="text-sm text-support/80 mb-4">
                Post opportunities or find them. Connect freelancers with hirers.
              </p>
              <a href="/opportunities" className="btn-primary w-full text-center text-sm">
                Browse Opportunities
              </a>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <button
              onClick={() => setShowValuation(true)}
              className="card p-4 sm:p-6 hover:card-hover transition-all duration-300 text-left"
            >
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-semibold text-support mb-1">Valuation Estimator</h3>
              <p className="text-sm text-support/60">Estimate your startup's value</p>
            </button>

            <button
              onClick={() => setShowLeaderboard(true)}
              className="card p-4 sm:p-6 hover:card-hover transition-all duration-300 text-left"
            >
              <div className="text-2xl mb-2">🏆</div>
              <h3 className="font-semibold text-support mb-1">Leaderboard</h3>
              <p className="text-sm text-support/60">Top founders by F-Coins</p>
            </button>

            <a
              href="/profile"
              className="card p-4 sm:p-6 hover:card-hover transition-all duration-300 text-left"
            >
              <div className="text-2xl mb-2">👤</div>
              <h3 className="font-semibold text-support mb-1">View Profile</h3>
              <p className="text-sm text-support/60">Check your public profile</p>
            </a>

            <a
              href="/settings"
              className="card p-4 sm:p-6 hover:card-hover transition-all duration-300 text-left"
            >
              <div className="text-2xl mb-2">⚙️</div>
              <h3 className="font-semibold text-support mb-1">Settings</h3>
              <p className="text-sm text-support/60">Manage your preferences</p>
            </a>
          </div>
        </div>

        {/* Modals */}
        {showOnboarding && (
          <OnboardingModal 
            open={showOnboarding}
            onClose={() => setShowOnboarding(false)}
            onDnaSurvey={() => {
              setShowOnboarding(false);
              window.location.href = '/dna-match';
            }}
          />
        )}
        
        {showValuation && (
          <ValuationEstimator />
        )}
        
        {showLeaderboard && (
          <Leaderboard />
        )}
      </main>
    </AuthGuard>
  );
} 