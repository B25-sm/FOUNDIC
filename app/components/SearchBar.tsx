"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../src/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

interface SearchResult {
  id: string;
  type: 'user' | 'post' | 'tag';
  title: string;
  subtitle?: string;
  icon: string;
  url: string;
}

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [user] = useAuthState(auth);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Search when debounced term changes
  useEffect(() => {
    if (debouncedTerm.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      const searchResults: SearchResult[] = [];
      const term = debouncedTerm.toLowerCase();

      try {
        // Search users
        const usersQuery = query(
          collection(db, 'users'),
          where('displayName', '>=', term),
          where('displayName', '<=', term + '\uf8ff'),
          limit(3)
        );
        const usersSnapshot = await getDocs(usersQuery);
        usersSnapshot.forEach(doc => {
          const userData = doc.data();
          searchResults.push({
            id: doc.id,
            type: 'user',
            title: userData.displayName || userData.email?.split('@')[0] || 'User',
            subtitle: userData.role || 'Member',
            icon: '👤',
            url: `/profile/${doc.id}`
          });
        });

        // Search posts
        const postsQuery = query(
          collection(db, 'posts'),
          orderBy('content'),
          limit(3)
        );
        const postsSnapshot = await getDocs(postsQuery);
        postsSnapshot.forEach(doc => {
          const postData = doc.data();
          if (postData.content.toLowerCase().includes(term)) {
            searchResults.push({
              id: doc.id,
              type: 'post',
              title: postData.content.substring(0, 50) + '...',
              subtitle: `by ${postData.author}`,
              icon: '📝',
              url: `/wall#post-${doc.id}`
            });
          }
        });

        // Search tags (from posts)
        const tagResults = new Set<string>();
        postsSnapshot.forEach(doc => {
          const postData = doc.data();
          if (postData.tags) {
            postData.tags.forEach((tag: string) => {
              if (tag.toLowerCase().includes(term)) {
                tagResults.add(tag);
              }
            });
          }
        });

        Array.from(tagResults).slice(0, 3).forEach(tag => {
          searchResults.push({
            id: tag,
            type: 'tag',
            title: `#${tag}`,
            subtitle: 'Tag',
            icon: '🏷️',
            url: `/search?q=${encodeURIComponent(tag)}`
          });
        });

        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedTerm]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setSearchTerm('');
    router.push(result.url);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setShowResults(false);
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            placeholder="Search users, posts, tags..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            className="w-full px-4 py-2.5 pl-11 pr-10 bg-midnight-900/60 border border-midnight-700/50 text-support placeholder-midnight-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-950/50 focus:border-gold-950/50 transition-all duration-300 text-sm backdrop-blur-sm shadow-inner"
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-midnight-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setResults([]);
                setShowResults(false);
              }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-midnight-400 hover:text-support transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showResults && (searchTerm.trim().length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-midnight-900/95 backdrop-blur-md border border-midnight-700/50 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gold-950 mx-auto"></div>
              <p className="text-sm text-support/60 mt-2">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-midnight-800/60 transition-colors duration-200 group"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">{result.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-support truncate">{result.title}</div>
                    {result.subtitle && (
                      <div className="text-sm text-support/60 truncate">{result.subtitle}</div>
                    )}
                  </div>
                </button>
              ))}
              {searchTerm.trim() && (
                <div className="border-t border-midnight-700/50 pt-2">
                  <button
                    onClick={() => {
                      setShowResults(false);
                      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-midnight-800/60 transition-colors duration-200 text-gold-950 font-medium"
                  >
                    <span className="text-lg">🔍</span>
                    <span>View all results for "{searchTerm}"</span>
                  </button>
                </div>
              )}
            </div>
          ) : searchTerm.trim().length >= 2 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-support/60">No results found</p>
              <button
                onClick={() => {
                  setShowResults(false);
                  router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
                }}
                className="mt-2 text-gold-950 hover:text-gold-800 text-sm font-medium"
              >
                Search anyway
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
