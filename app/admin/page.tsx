"use client";

import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../src/firebase';
import { getFirestore, collection, query, orderBy, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import app from '../../src/firebase';
import { ROLES } from '../utils/roles';

const db = getFirestore(app);

// Only you (the founder) can access admin features
const FOUNDER_EMAILS = [
  'saimahendra222@gmail.com',
  'mahendra10kcoders@gmail.com',
];

export default function AdminPage() {
  const [user, loading] = useAuthState(auth);
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [updating, setUpdating] = useState('');
  const [banning, setBanning] = useState('');
  const [analytics, setAnalytics] = useState({ users: 0, posts: 0, pods: 0 });

  useEffect(() => {
    (async () => {
      setLoadingData(true);
      const postSnap = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc')));
      setPosts(postSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const userSnap = await getDocs(collection(db, 'users'));
      setUsers(userSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const podsSnap = await getDocs(collection(db, 'pods'));
      setAnalytics({
        users: userSnap.size,
        posts: postSnap.size,
        pods: podsSnap.size,
      });
      setLoadingData(false);
    })();
  }, []);

  const handleRoleChange = async (uid: string, newRole: string) => {
    setUpdating(uid);
    await updateDoc(doc(db, 'users', uid), { role: newRole });
    setUsers(users => users.map(u => u.id === uid ? { ...u, role: newRole } : u));
    setUpdating('');
  };

  const handleBan = async (uid: string) => {
    if (!window.confirm('Are you sure you want to ban this user?')) return;
    setBanning(uid);
    await updateDoc(doc(db, 'users', uid), { banned: true });
    setUsers(users => users.map(u => u.id === uid ? { ...u, banned: true } : u));
    setBanning('');
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Delete this post?')) return;
    await deleteDoc(doc(db, 'posts', postId));
    setPosts(posts => posts.filter(p => p.id !== postId));
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-midnight-950 text-support px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-950 mx-auto mb-4"></div>
          <p className="text-support/60 text-sm sm:text-base">Loading...</p>
        </div>
      </main>
    );
  }

  // Check if current user is the founder
  const isFounder = user && FOUNDER_EMAILS.includes(user.email?.toLowerCase() || '');

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-midnight-950 text-support px-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-teal-950 mb-4">Authentication Required</h2>
          <p className="text-support mb-4 text-sm sm:text-base">Please sign in to access the admin panel.</p>
          <a href="/login" className="btn-primary text-sm sm:text-base">
            Sign In
          </a>
        </div>
      </main>
    );
  }

  if (!isFounder) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-midnight-950 text-support px-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-teal-950 mb-4">Access Denied</h2>
          <p className="text-support mb-4 text-sm sm:text-base">
            Only authorized administrators can access this page.
          </p>
          <p className="text-support/60 mb-4 text-sm sm:text-base">
            Current user: {user.email}
          </p>
          <a href="/dashboard" className="btn-primary text-sm sm:text-base">
            Go to Dashboard
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center bg-midnight-950 text-support px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="w-full max-w-3xl lg:max-w-6xl">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold gradient-text mb-4 sm:mb-6">Admin Panel</h1>
        <p className="text-support/60 mb-6 text-sm sm:text-base">Welcome, {user.email}</p>
        
        {/* Analytics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="card p-3 sm:p-4 text-center">
            <div className="text-base sm:text-lg font-bold gradient-text">{analytics.users}</div>
            <div className="text-support/70 text-xs sm:text-sm">Users</div>
          </div>
          <div className="card p-3 sm:p-4 text-center">
            <div className="text-base sm:text-lg font-bold gradient-text">{analytics.posts}</div>
            <div className="text-support/70 text-xs sm:text-sm">Posts</div>
          </div>
          <div className="card p-3 sm:p-4 text-center">
            <div className="text-base sm:text-lg font-bold gradient-text">{analytics.pods}</div>
            <div className="text-support/70 text-xs sm:text-sm">Pods</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Moderation queue */}
          <div>
            <h2 className="font-bold mb-2 text-sm sm:text-base">Recent Posts</h2>
            <div className="flex flex-col gap-3">
              {loadingData ? (
                <div className="text-support/60 text-center text-sm sm:text-base">Loading...</div>
              ) : posts.length === 0 ? (
                <div className="text-support/60 text-center text-sm sm:text-base">No posts yet.</div>
              ) : posts.slice(0, 8).map(post => (
                <div key={post.id} className="bg-midnight-800/60 rounded-lg px-3 sm:px-4 py-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                    <span className="font-semibold text-support/90 text-sm sm:text-base">{post.author}</span>
                    <span className="text-xs text-support/60 sm:ml-auto">{post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : 'now'}</span>
                  </div>
                  <div className="text-support/80 mb-1 text-sm sm:text-base">{post.content}</div>
                  <div className="flex flex-col sm:flex-row sm:gap-2 text-xs text-support/60 mb-2">
                    <span>Type: {post.type}</span>
                    <span>Likes: {post.likes?.length || 0}</span>
                  </div>
                  <button className="btn-ghost text-xs text-error-500" onClick={() => handleDeletePost(post.id)}>Delete</button>
                </div>
              ))}
            </div>
          </div>
          
          {/* User management */}
          <div>
            <h2 className="font-bold mb-2 text-sm sm:text-base">User Management</h2>
            <div className="flex flex-col gap-3">
              {loadingData ? (
                <div className="text-support/60 text-center text-sm sm:text-base">Loading...</div>
              ) : users.length === 0 ? (
                <div className="text-support/60 text-center text-sm sm:text-base">No users yet.</div>
              ) : users.map(u => (
                <div key={u.id} className="bg-midnight-800/60 rounded-lg px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <span className="font-semibold text-support/90 flex-1 text-sm sm:text-base">{u.displayName || u.email}</span>
                  <div className="flex items-center gap-2">
                    <select
                      className="input-field text-xs sm:text-sm w-24 sm:w-28"
                      value={u.role || 'founder'}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      disabled={updating === u.id}
                    >
                      {ROLES.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <button
                      className="btn-ghost text-xs text-error-500"
                      onClick={() => handleBan(u.id)}
                      disabled={banning === u.id || u.banned}
                    >
                      {u.banned ? 'Banned' : banning === u.id ? 'Banning...' : 'Ban'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Flagged content placeholder */}
        <div className="mt-8 sm:mt-10">
          <h2 className="font-bold mb-2 text-sm sm:text-base">Flagged Content (Coming Soon)</h2>
          <div className="text-support/60 text-center text-sm sm:text-base">No flagged content yet.</div>
        </div>
      </div>
    </main>
  );
} 