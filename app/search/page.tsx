"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../src/firebase';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import AuthGuard from '../components/AuthGuard';

interface SearchResult {
  id: string;
  type: 'user' | 'post';
  title: string;
  subtitle: string;
  avatar?: string;
  role?: string;
  content?: string;
  postType?: string;
  likes?: number;
  comments?: number;
  createdAt?: any;
  authorId?: string;
  authorName?: string;
  profilePicture?: string;
  images?: string[];
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user] = useAuthState(auth);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'users' | 'posts'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    } else {
      setResults([]);
    }
  }, [searchParams]);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    const queryLower = searchTerm.toLowerCase();
    const allResults: SearchResult[] = [];

    try {
      // Search Users
      console.log('Searching users for:', searchTerm);
      const usersQuery = query(
        collection(db, 'users'),
        limit(20)
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      console.log('Found users:', usersSnapshot.docs.length);
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        const displayName = userData.displayName || '';
        const email = userData.email || '';
        const role = userData.role || '';
        const bio = userData.bio || '';
        
        // Check if search term matches name, email, role, or bio
        if (
          displayName.toLowerCase().includes(queryLower) ||
          email.toLowerCase().includes(queryLower) ||
          role.toLowerCase().includes(queryLower) ||
          bio.toLowerCase().includes(queryLower)
        ) {
          allResults.push({
            id: doc.id,
            type: 'user',
            title: displayName || email?.split('@')[0] || 'User',
            subtitle: `${role || 'Member'} • ${userData.location || 'No location'}`,
            avatar: userData.profilePicture || displayName?.[0] || email?.[0] || 'U',
            role: role,
            profilePicture: userData.profilePicture
          });
        }
      });

      // Search Posts
      console.log('Searching posts for:', searchTerm);
      const postsQuery = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const postsSnapshot = await getDocs(postsQuery);
      console.log('Found posts:', postsSnapshot.docs.length);
      
      postsSnapshot.forEach((doc) => {
        const postData = doc.data();
        const content = postData.content || '';
        const postType = postData.type || '';
        
        // Check if search term matches post content or type
        if (
          content.toLowerCase().includes(queryLower) ||
          postType.toLowerCase().includes(queryLower)
        ) {
          allResults.push({
            id: doc.id,
            type: 'post',
            title: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
            subtitle: `${postType || 'general'} • ${postData.likes?.length || 0} likes • ${postData.comments?.length || 0} comments`,
            content: content,
            postType: postType,
            likes: postData.likes?.length || 0,
            comments: postData.comments?.length || 0,
            createdAt: postData.createdAt,
            authorId: postData.authorId,
            authorName: postData.author,
            images: postData.images || []
          });
        }
      });

      console.log('Total search results:', allResults.length);
      setResults(allResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredResults = () => {
    if (activeFilter === 'all') return results;
    return results.filter(result => result.type === activeFilter);
  };

  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Update URL with new search query
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const filteredResults = getFilteredResults();
  const userResults = results.filter(r => r.type === 'user');
  const postResults = results.filter(r => r.type === 'post');

  return (
    <AuthGuard>
      <main className="min-h-screen bg-black text-white px-4 py-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Search Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Search</h1>
            
            {/* Search Bar */}
            <form onSubmit={handleNewSearch} className="relative mb-6">
              <input
                type="text"
                placeholder="Search users, posts, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-teal-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            {/* Filter Tabs */}
            <div className="flex gap-4 border-b border-gray-700">
              <button
                onClick={() => setActiveFilter('all')}
                className={`pb-2 px-1 border-b-2 transition-colors ${
                  activeFilter === 'all'
                    ? 'border-teal-500 text-teal-500'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                All ({results.length})
              </button>
              <button
                onClick={() => setActiveFilter('users')}
                className={`pb-2 px-1 border-b-2 transition-colors ${
                  activeFilter === 'users'
                    ? 'border-teal-500 text-teal-500'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Users ({userResults.length})
              </button>
              <button
                onClick={() => setActiveFilter('posts')}
                className={`pb-2 px-1 border-b-2 transition-colors ${
                  activeFilter === 'posts'
                    ? 'border-teal-500 text-teal-500'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Posts ({postResults.length})
              </button>
            </div>
          </div>

          {/* Search Results */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Searching...</p>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery ? 'No results found' : 'Start searching'}
                </h3>
                <p className="text-gray-400">
                  {searchQuery 
                    ? `No results found for "${searchQuery}". Try different keywords.`
                    : 'Enter a search term to find users, posts, and more.'
                  }
                </p>
              </div>
            ) : (
              filteredResults.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => {
                    if (result.type === 'user') {
                      router.push(`/user/${result.id}`);
                    } else if (result.type === 'post') {
                      router.push(`/wall`); // Could navigate to specific post
                    }
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar/Icon */}
                    <div className="flex-shrink-0">
                      {result.type === 'user' ? (
                        result.profilePicture ? (
                          <img
                            src={result.profilePicture}
                            alt={result.title}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {result.avatar}
                          </div>
                        )
                      ) : (
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">{result.title}</h3>
                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                          {result.type}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{result.subtitle}</p>
                      
                      {/* Post Images */}
                      {result.type === 'post' && result.images && result.images.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {result.images.slice(0, 3).map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Post image ${index + 1}`}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ))}
                          {result.images.length > 3 && (
                            <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center text-xs text-gray-400">
                              +{result.images.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      <button className="text-teal-500 hover:text-teal-400 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}