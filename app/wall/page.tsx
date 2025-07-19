"use client";

import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../src/firebase';
import {
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, Timestamp, doc, updateDoc, arrayUnion, arrayRemove
} from 'firebase/firestore';
import app from '../../src/firebase';

const db = getFirestore(app);

const POST_TYPES = [
  { value: 'fail', label: 'Fail Forward', icon: '💡' },
  { value: 'signal', label: 'Signal Boost', icon: '📢' },
  { value: 'investor', label: 'Investor Connect', icon: '💰' },
];

function CommentModal({ post, open, onClose }) {
  const [comment, setComment] = useState('');
  const [user] = useAuthState(auth);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (!post?.id) return;
    const unsub = onSnapshot(collection(db, 'posts', post.id, 'comments'), qSnap => {
      setComments(qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [post?.id]);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;
    await addDoc(collection(db, 'posts', post.id, 'comments'), {
      author: user.displayName || user.email || 'You',
      authorId: user.uid,
      content: comment,
      createdAt: Timestamp.now(),
    });
    setComment('');
  };

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-2">Comments</h2>
        <form className="flex gap-2 mb-4" onSubmit={handleComment}>
          <input
            className="input-field flex-1"
            type="text"
            placeholder="Add a comment..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={180}
            required
          />
          <button className="btn-primary px-4" type="submit">Send</button>
        </form>
        <div className="flex flex-col gap-3 max-h-60 overflow-y-auto">
          {comments.length === 0 ? (
            <div className="text-support/60 text-center">No comments yet.</div>
          ) : comments.map(c => (
            <div key={c.id} className="bg-midnight-800/60 rounded-lg px-3 py-2 text-left">
              <span className="font-semibold text-support/90">{c.author}</span>
              <span className="ml-2 text-xs text-support/60">{c.createdAt?.toDate ? c.createdAt.toDate().toLocaleString() : 'now'}</span>
              <div className="text-support/80 mt-1">{c.content}</div>
            </div>
          ))}
        </div>
        <button className="btn-ghost mt-4 w-full" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default function WallPage() {
  const [user] = useAuthState(auth);
  const [postType, setPostType] = useState(POST_TYPES[0].value);
  const [content, setContent] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [commentPost, setCommentPost] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;
    setPosting(true);
    await addDoc(collection(db, 'posts'), {
      type: postType,
      author: user.displayName || user.email || 'You',
      authorId: user.uid,
      content,
      likes: [],
      reposts: [],
      createdAt: Timestamp.now(),
    });
    setContent('');
    setPosting(false);
  };

  const handleLike = async (post) => {
    if (!user) return;
    const ref = doc(db, 'posts', post.id);
    const liked = post.likes?.includes(user.uid);
    await updateDoc(ref, {
      likes: liked ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });
  };

  const handleRepost = async (post) => {
    if (!user) return;
    const ref = doc(db, 'posts', post.id);
    const reposted = post.reposts?.includes(user.uid);
    await updateDoc(ref, {
      reposts: reposted ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });
  };

  return (
    <main className="min-h-screen flex flex-col items-center bg-midnight-950 text-support px-2 py-8">
      <div className="max-w-2xl w-full">
        {/* Post creation form */}
        <form className="card p-6 mb-8 flex flex-col gap-3 animate-fade-in-up" onSubmit={handlePost}>
          <div className="flex gap-2 items-center">
            <select
              className="input-field w-40"
              value={postType}
              onChange={e => setPostType(e.target.value)}
            >
              {POST_TYPES.map(pt => (
                <option key={pt.value} value={pt.value}>{pt.icon} {pt.label}</option>
              ))}
            </select>
            <input
              className="input-field flex-1"
              type="text"
              placeholder="Share a lesson, win, or connect..."
              value={content}
              onChange={e => setContent(e.target.value)}
              maxLength={240}
              required
              disabled={posting}
            />
            <button className="btn-primary px-6" type="submit" disabled={posting}>{posting ? 'Posting...' : 'Post'}</button>
          </div>
        </form>
        {/* Posts feed */}
        <div className="flex flex-col gap-6">
          {loading ? (
            <div className="text-support/60 text-center">Loading feed...</div>
          ) : posts.length === 0 ? (
            <div className="text-support/60 text-center">No posts yet. Be the first to share!</div>
          ) : posts.map(post => (
            <div key={post.id} className="card p-6 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{POST_TYPES.find(pt => pt.value === post.type)?.icon}</span>
                <span className="font-semibold text-support">{post.author}</span>
                <span className="ml-auto text-xs text-support/60">
                  {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : 'now'}
                </span>
              </div>
              <div className="text-support/90 mb-3 text-left">{post.content}</div>
              <div className="flex gap-6 text-support/70 text-sm">
                <button
                  className={`hover:text-gold-950 transition ${post.likes?.includes(user?.uid) ? 'text-gold-950 font-bold' : ''}`}
                  onClick={() => handleLike(post)}
                  disabled={!user}
                >
                  <span>👍</span> {post.likes?.length || 0}
                </button>
                <button
                  className="hover:text-gold-950 transition"
                  onClick={() => setCommentPost(post)}
                >
                  <span>💬</span> Comments
                </button>
                <button
                  className={`hover:text-gold-950 transition ${post.reposts?.includes(user?.uid) ? 'text-gold-950 font-bold' : ''}`}
                  onClick={() => handleRepost(post)}
                  disabled={!user}
                >
                  <span>🔁</span> {post.reposts?.length || 0}
                </button>
              </div>
            </div>
          ))}
        </div>
        <CommentModal post={commentPost} open={!!commentPost} onClose={() => setCommentPost(null)} />
      </div>
    </main>
  );
} 