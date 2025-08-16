"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../src/firebase';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import app from '../../src/firebase';
import AuthGuard from '../components/AuthGuard';
import SearchBar from '../components/SearchBar';

const db = getFirestore(app);

interface SearchResult {
  id: string;
  type: 'user' | 'post' | 'tag';
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
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [user] = useAuthState(auth);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'users' | 'posts' | 'tags'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = async (searchTerm: string) => {
    setLoading(true);
    const queryLower = searchTerm.toLowerCase();
    const allResults: SearchResult[] = [];

    try {
      // Search Users
      const usersQuery = query(collection(db, 'users'), limit(50));
      const usersSnapshot = await getDocs(usersQuery);
      
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        const displayName = userData.displayName || userData.email?.split('@')[0] || 'User';
        const email = userData.email || '';
        
        if (displayName.toLowerCase().includes(queryLower) || 
            email.toLowerCase().includes(queryLower) ||
            userData.role?.toLowerCase().includes(queryLower)) {
          allResults.push({
            id: doc.id,
            type: 'user',
            title: displayName,
            subtitle: `${userData.role || 'Member'} • ${email}`,
            avatar: displayName[0]?.toUpperCase(),
            role: userData.role,
          });
        }
      });

      // Search Posts
      const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(100));
      const postsSnapshot = await getDocs(postsQuery);
      
      postsSnapshot.docs.forEach(doc => {
        const postData = doc.data();
        const content = postData.content || '';
        const author = postData.author || 'User';
        const postType = postData.type || 'general';
        
        if (content.toLowerCase().includes(queryLower) || 
            author.toLowerCase().includes(queryLower) ||
            postType.toLowerCase().includes(queryLower)) {
          allResults.push({
            id: doc.id,
            type: 'post',
            title: `${author} • ${postType}`,
            subtitle: content.length > 150 ? content.substring(0, 150) + '...' : content,
            content: content,
            postType: postType,
            likes: postData.likes?.length || 0,
            comments: postData.comments?.length || 0,
            createdAt: postData.createdAt,
            authorId: postData.authorId,
          });
        }
      });

      // Search Tags (post types)
      const postTypes = ['general', 'milestone', 'lesson', 'question', 'opportunity', 'celebration', 'fail', 'investor'];
      postTypes.forEach(type => {
        if (type.toLowerCase().includes(queryLower)) {
          allResults.push({
            id: `tag-${type}`,
            type: 'tag',
            title: `#${type}`,
            subtitle: `Posts tagged as ${type}`,
          });
        }
      });

      // Sort results by relevance
      const sortedResults = allResults.sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.title.toLowerCase() === queryLower || a.subtitle.toLowerCase().includes(queryLower);
        const bExact = b.title.toLowerCase() === queryLower || b.subtitle.toLowerCase().includes(queryLower);
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Then by type (users first, then posts, then tags)
        const typeOrder = { user: 0, post: 1, tag: 2 };
        return typeOrder[a.type] - typeOrder[b.type];
      });

      setResults(sortedResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredResults = () => {
    if (activeFilter === 'all') return results;
    
    // Map filter values to result types
    const filterMap: { [key: string]: 'user' | 'post' | 'tag' } = {
      'users': 'user',
      'posts': 'post',
      'tags': 'tag'
    };
    
    const targetType = filterMap[activeFilter];
    return results.filter(result => result.type === targetType);
  };

  const getResultCount = (type: 'user' | 'post' | 'tag') => {
    return results.filter(result => result.type === type).length;
  };

  const filteredResults = getFilteredResults();

  return (
    <AuthGuard>
      <main className="min-h-screen bg-midnight-950 text-support px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Search Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold gradient-text mb-4">
              Search Results
            </h1>
            <div className="mb-4 sm:mb-6">
              <SearchBar />
            </div>
            
            {/* Search Stats */}
            <div className="text-support/60 mb-4 text-sm sm:text-base">
              {loading ? (
                <span>Searching...</span>
              ) : (
                <span>
                  Found {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                </span>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeFilter === 'all' ? 'bg-gold-950 text-midnight-950' : 'bg-midnight-800 text-support hover:bg-midnight-700'
                }`}
              >
                All ({results.length})
              </button>
              <button
                onClick={() => setActiveFilter('users')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeFilter === 'users' ? 'bg-gold-950 text-midnight-950' : 'bg-midnight-800 text-support hover:bg-midnight-700'
                }`}
              >
                Users ({getResultCount('user')})
              </button>
              <button
                onClick={() => setActiveFilter('posts')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeFilter === 'posts' ? 'bg-gold-950 text-midnight-950' : 'bg-midnight-800 text-support hover:bg-midnight-700'
                }`}
              >
                Posts ({getResultCount('post')})
              </button>
              <button
                onClick={() => setActiveFilter('tags')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeFilter === 'tags' ? 'bg-gold-950 text-midnight-950' : 'bg-midnight-800 text-support hover:bg-midnight-700'
                }`}
              >
                Tags ({getResultCount('tag')})
              </button>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="text-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-950 mx-auto mb-4"></div>
              <p className="text-support/60 text-sm sm:text-base">Searching...</p>
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {filteredResults.map((result, index) => (
                <div key={`${result.type}-${result.id}-${index}`} className="card p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Result Icon */}
                    <div className="flex-shrink-0">
                      {result.type === 'user' && (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gold-950 rounded-full flex items-center justify-center text-midnight-950 font-bold text-base sm:text-lg">
                          {result.avatar}
                        </div>
                      )}
                      {result.type === 'post' && (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-midnight-700 rounded-full flex items-center justify-center text-support text-base sm:text-lg">
                          📝
                        </div>
                      )}
                      {result.type === 'tag' && (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gold-950/20 rounded-full flex items-center justify-center text-gold-950 text-base sm:text-lg">
                          #
                        </div>
                      )}
                    </div>

                    {/* Result Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="font-semibold text-support text-base sm:text-lg">{result.title}</h3>
                        <span className="px-2 py-1 bg-midnight-800 rounded text-xs text-support/60 capitalize">
                          {result.type}
                        </span>
                      </div>
                      
                      <p className="text-support/80 mb-3 text-sm sm:text-base">{result.subtitle}</p>
                      
                      {result.type === 'post' && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-support/60">
                          <span>👍 {result.likes}</span>
                          <span>💬 {result.comments}</span>
                          {result.createdAt && (
                            <span>
                              {result.createdAt.toDate ? 
                                result.createdAt.toDate().toLocaleDateString() : 
                                'Recently'
                              }
                            </span>
                          )}
                        </div>
                      )}
                      
                      {result.type === 'user' && result.role && (
                        <div className="text-xs sm:text-sm text-support/60">
                          Role: {result.role}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => {
                          if (result.type === 'user') {
                            window.location.href = `/wall?profile=${result.id}`;
                          } else if (result.type === 'post') {
                            window.location.href = `/wall?post=${result.id}`;
                          } else if (result.type === 'tag') {
                            window.location.href = `/wall?filter=${result.title.substring(1)}`;
                          }
                        }}
                        className="px-3 sm:px-4 py-2 bg-gold-950 text-midnight-950 rounded-lg hover:bg-gold-800 transition-colors text-xs sm:text-sm font-medium"
                      >
                        {result.type === 'user' ? 'View Profile' : 
                         result.type === 'post' ? 'View Post' : 'View Posts'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="text-4xl sm:text-6xl mb-4">🔍</div>
              <h3 className="text-lg sm:text-xl font-semibold text-support mb-2">No results found</h3>
              <p className="text-support/60 mb-4 sm:mb-6 text-sm sm:text-base">
                No results found for "{searchQuery}". Try different keywords or check your spelling.
              </p>
              <div className="text-xs sm:text-sm text-support/40">
                <p>Search tips:</p>
                <ul className="mt-2 space-y-1">
                  <li>• Try searching for user names, post content, or post types</li>
                  <li>• Use broader terms to find more results</li>
                  <li>• Check the spelling of your search terms</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
