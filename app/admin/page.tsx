"use client";

import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../src/firebase';
import { getFirestore, collection, query, orderBy, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import app from '../../src/firebase';

const db = getFirestore(app);

const ROLES = [
  { value: 'founder', label: 'Founder' },
  { value: 'investor', label: 'Investor' },
  { value: 'admin', label: 'Admin' },
];

export default function AdminPage() {
  const [user] = useAuthState(auth);
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState('');
  const [banning, setBanning] = useState('');
  const [analytics, setAnalytics] = useState({ users: 0, posts: 0, pods: 0 });

  useEffect(() => {
    (async () => {
      setLoading(true);
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
      setLoading(false);
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

  return (
    <main className="min-h-screen flex flex-col items-center bg-midnight-950 text-support px-2 py-8">
      <div className="max-w-3xl w-full">
        <h1 className="text-2xl font-bold gradient-text mb-6">Admin Panel</h1>
        {/* Analytics */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card p-4 text-center">
            <div className="text-lg font-bold gradient-text">{analytics.users}</div>
            <div className="text-support/70 text-xs">Users</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-lg font-bold gradient-text">{analytics.posts}</div>
            <div className="text-support/70 text-xs">Posts</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-lg font-bold gradient-text">{analytics.pods}</div>
            <div className="text-support/70 text-xs">Pods</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Moderation queue */}
          <div>
            <h2 className="font-bold mb-2">Recent Posts</h2>
            <div className="flex flex-col gap-3">
              {loading ? (
                <div className="text-support/60 text-center">Loading...</div>
              ) : posts.length === 0 ? (
                <div className="text-support/60 text-center">No posts yet.</div>
              ) : posts.slice(0, 8).map(post => (
                <div key={post.id} className="bg-midnight-800/60 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-support/90">{post.author}</span>
                    <span className="ml-auto text-xs text-support/60">{post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : 'now'}</span>
                  </div>
                  <div className="text-support/80 mb-1">{post.content}</div>
                  <div className="flex gap-2 text-xs text-support/60 mb-2">
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
            <h2 className="font-bold mb-2">User Management</h2>
            <div className="flex flex-col gap-3">
              {loading ? (
                <div className="text-support/60 text-center">Loading...</div>
              ) : users.length === 0 ? (
                <div className="text-support/60 text-center">No users yet.</div>
              ) : users.map(u => (
                <div key={u.id} className="bg-midnight-800/60 rounded-lg px-4 py-3 flex items-center gap-3">
                  <span className="font-semibold text-support/90 flex-1">{u.displayName || u.email}</span>
                  <select
                    className="input-field text-xs w-28"
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
              ))}
            </div>
          </div>
        </div>
        {/* Flagged content placeholder */}
        <div className="mt-10">
          <h2 className="font-bold mb-2">Flagged Content (Coming Soon)</h2>
          <div className="text-support/60 text-center">No flagged content yet.</div>
        </div>
      </div>
    </main>
  );
} 