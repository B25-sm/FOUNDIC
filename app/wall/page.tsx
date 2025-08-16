"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { auth, db, storage } from '../../src/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  arrayUnion, 
  arrayRemove, 
  Timestamp,
  deleteDoc,
  getDoc,
  where
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AuthGuard from '../components/AuthGuard';
import WhoToFollow from '../components/WhoToFollow';
import toast from 'react-hot-toast';

const POST_TYPES = [
  { value: 'general', label: 'General Update', icon: '📝' },
  { value: 'milestone', label: 'Milestone', icon: '🎯' },
  { value: 'lesson', label: 'Lesson Learned', icon: '💡' },
  { value: 'question', label: 'Question', icon: '❓' },
  { value: 'opportunity', label: 'Opportunity', icon: '🚀' },
  { value: 'celebration', label: 'Celebration', icon: '🎉' },
  { value: 'fail', label: 'Fail Forward', icon: '💪' },
  { value: 'investor', label: 'Investor Connect', icon: '💰' },
  { value: 'opportunity', label: 'Opportunity Posting', icon: '💼' },
];

const FEED_TYPES = [
  { value: 'all', label: 'All Posts', icon: '🌐' },
  { value: 'following', label: 'Following', icon: '👥' },
  { value: 'trending', label: 'Trending', icon: '🔥' },
];

// Professional SVG icons for post types
const getPostTypeIcon = (type: string) => {
  const icons: { [key: string]: JSX.Element } = {
    general: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    milestone: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    lesson: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    question: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
         opportunity: (
       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
       </svg>
     ),
     celebration: (
       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
       </svg>
     ),
     fail: (
       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
       </svg>
     ),
     investor: (
       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
       </svg>
     ),
     job: (
       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
       </svg>
     ),
  };
  return icons[type] || icons.general;
};

function CommentModal({ post, open, onClose }) {
  const [comment, setComment] = useState('');
  const [user] = useAuthState(auth);
  const [comments, setComments] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

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
      replies: [],
    });
    setComment('');
  };

  const handleReply = async (e, commentId) => {
    e.preventDefault();
    if (!replyText.trim() || !user) return;
    
    const commentRef = doc(db, 'posts', post.id, 'comments', commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (commentDoc.exists()) {
      const currentReplies = commentDoc.data().replies || [];
      const newReply = {
        id: Date.now().toString(), // Simple ID for replies
        author: user.displayName || user.email || 'You',
        authorId: user.uid,
        content: replyText,
        createdAt: Timestamp.now(),
      };
      
      await updateDoc(commentRef, {
        replies: [...currentReplies, newReply]
      });
      
      setReplyText('');
      setReplyingTo(null);
    }
  };

  const startReply = (commentId) => {
    setReplyingTo(commentId);
    setReplyText('');
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
  };

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-2 text-gray-900">Comments</h2>
        
        {/* Add comment form */}
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

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {comments.length === 0 ? (
            <div className="text-gray-600 text-center">No comments yet.</div>
          ) : comments.map(c => (
            <div key={c.id} className="bg-gray-50 rounded-lg px-3 py-2 text-left">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <span className="font-semibold text-gray-900">{c.author}</span>
                  <span className="ml-2 text-xs text-gray-600">
                    {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleString() : 'now'}
                  </span>
                  <div className="text-gray-800 mt-1">{c.content}</div>
                </div>
              </div>

              {/* Reply button next to comment content */}
              <div className="flex items-center gap-4 mt-2">
                <button
                  onClick={() => startReply(c.id)}
                  className="text-xs text-gray-600 hover:text-gold-950 transition-colors"
                >
                  Reply
                </button>
              </div>

              {/* Reply form */}
              {replyingTo === c.id && (
                <form className="mt-3 flex gap-2" onSubmit={(e) => handleReply(e, c.id)}>
                  <input
                    className="input-field flex-1 text-sm"
                    type="text"
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    maxLength={150}
                    required
                  />
                  <button className="btn-secondary px-3 py-1 text-xs" type="submit">Reply</button>
                  <button 
                    type="button"
                    onClick={cancelReply}
                    className="text-xs text-gray-600 hover:text-gray-900 px-2"
                  >
                    Cancel
                  </button>
                </form>
              )}

              {/* Replies */}
              {c.replies && c.replies.length > 0 && (
                <div className="mt-3 ml-4 space-y-2 border-l-2 border-gray-300 pl-3">
                  {c.replies.map((reply, index) => (
                    <div key={reply.id || index} className="bg-gray-100 rounded px-2 py-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{reply.author}</span>
                        <span className="text-xs text-gray-600">
                          {reply.createdAt?.toDate ? reply.createdAt.toDate().toLocaleString() : 'now'}
                        </span>
                      </div>
                      <div className="text-gray-800 text-sm mt-1">{reply.content}</div>
                    </div>
                  ))}
                </div>
              )}
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
  const router = useRouter();
  const [postType, setPostType] = useState(POST_TYPES[0].value);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [commentPost, setCommentPost] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [feedType, setFeedType] = useState('all');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [following, setFollowing] = useState<string[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);

  useEffect(() => {
    // Get user data including following/followers
    if (user) {
      const getUserData = async () => {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role);
          setFollowing(userData.following || []);
          setFollowers(userData.followers || []);
        }
      };
      getUserData();
    }

    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      imageUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imageUrls]);

  const handleImageUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024 // 10MB limit (will be compressed)
    );
    
    if (validFiles.length === 0) {
      alert('Please select valid image files (max 10MB each - will be compressed automatically)');
      return;
    }
    
    if (validFiles.length + images.length > 4) {
      alert('Maximum 4 images allowed per post');
      return;
    }
    
    setImages(prev => [...prev, ...validFiles]);
    
    // Create preview URLs
    const newUrls = validFiles.map(file => URL.createObjectURL(file));
    setImageUrls(prev => [...prev, ...newUrls]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => {
      const newUrls = prev.filter((_, i) => i !== index);
      // Revoke the removed URL to prevent memory leaks
      const removedUrl = prev[index];
      if (removedUrl && removedUrl.startsWith('blob:')) {
        URL.revokeObjectURL(removedUrl);
      }
      return newUrls;
    });
  };

  const uploadImagesToStorage = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    
    // Since CORS is blocking Firebase Storage from localhost, use base64 directly
    console.log('Using base64 conversion for images due to CORS restrictions...');
    return await convertImagesToBase64(files);
  };

  // Function to compress and convert images to base64
  const convertImagesToBase64 = async (files: File[]): Promise<string[]> => {
    const base64Promises = files.map(file => {
      return new Promise<string>((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          // Calculate new dimensions to reduce file size
          let { width, height } = img;
          const maxDimension = 800; // Max width/height
          const maxFileSize = 500 * 1024; // 500KB target
          
          // Resize if image is too large
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height * maxDimension) / width;
              width = maxDimension;
            } else {
              width = (width * maxDimension) / height;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress image
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression
          let quality = 0.8; // Start with 80% quality
          let base64String = canvas.toDataURL('image/jpeg', quality);
          
          // If still too large, reduce quality further
          while (base64String.length > maxFileSize && quality > 0.1) {
            quality -= 0.1;
            base64String = canvas.toDataURL('image/jpeg', quality);
          }
          
          // If still too large, resize further
          if (base64String.length > maxFileSize) {
            const scaleFactor = Math.sqrt(maxFileSize / base64String.length);
            const newWidth = Math.floor(width * scaleFactor);
            const newHeight = Math.floor(height * scaleFactor);
            
            canvas.width = newWidth;
            canvas.height = newHeight;
            ctx?.drawImage(img, 0, 0, newWidth, newHeight);
            base64String = canvas.toDataURL('image/jpeg', 0.5);
          }
          
          console.log(`Image compressed: ${file.name} - Original: ${file.size} bytes, Compressed: ${base64String.length} bytes`);
          resolve(base64String);
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
      });
    });
    
    return await Promise.all(base64Promises);
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && images.length === 0) || !user) return;
    
    setPosting(true);
    setUploadingImages(true);
    
    try {
      console.log('Starting post creation...');
      
      // Upload images first
      let uploadedImageUrls: string[] = [];
      if (images.length > 0) {
        console.log('Uploading', images.length, 'images...');
        uploadedImageUrls = await uploadImagesToStorage(images);
        console.log('Images uploaded:', uploadedImageUrls);
        
        // Check total size of all images
        const totalSize = uploadedImageUrls.reduce((total, url) => total + url.length, 0);
        if (totalSize > 900 * 1024) { // 900KB limit to be safe
          alert('Images are too large even after compression. Please try with smaller images or fewer images.');
          return;
        }
      }
      
      // Create the post with image URLs
      const postData = {
        type: postType,
        author: user.displayName || user.email || 'You',
        authorId: user.uid,
        authorRole: userRole,
        content,
        images: uploadedImageUrls,
        likes: [],
        reposts: [],
        comments: [],
        createdAt: Timestamp.now(),
      };
      
      console.log('Creating post with data:', postData);
      
      const docRef = await addDoc(collection(db, 'posts'), postData);
      console.log('Post created successfully with ID:', docRef.id);
      
      // Clear form
      setContent('');
      setImages([]);
      setImageUrls([]);
      
      console.log('Post creation completed successfully');
    } catch (error) {
      console.error('Error posting:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('longer than 1048487 bytes')) {
        alert('Images are too large for storage. Please try with smaller images or fewer images.');
      } else if (error.code === 'storage/unauthorized') {
        alert('Upload failed: Storage access denied. Please check Firebase Storage permissions.');
      } else if (error.code === 'storage/quota-exceeded') {
        alert('Upload failed: Storage quota exceeded.');
      } else if (error.code === 'storage/retry-limit-exceeded') {
        alert('Upload failed: Network error. Please try again.');
      } else {
        alert(`Failed to post: ${error.message || 'Unknown error occurred'}`);
      }
    } finally {
      setPosting(false);
      setUploadingImages(false);
    }
  };

  const handleFollow = async (authorId: string) => {
    if (!user || authorId === user.uid) return;
    
    const userRef = doc(db, 'users', user.uid);
    const authorRef = doc(db, 'users', authorId);
    
    const isFollowing = following.includes(authorId);
    
    if (isFollowing) {
      // Unfollow
      await updateDoc(userRef, {
        following: arrayRemove(authorId)
      });
      await updateDoc(authorRef, {
        followers: arrayRemove(user.uid)
      });
      setFollowing(prev => prev.filter(id => id !== authorId));
    } else {
      // Follow
      await updateDoc(userRef, {
        following: arrayUnion(authorId)
      });
      await updateDoc(authorRef, {
        followers: arrayUnion(user.uid)
      });
      setFollowing(prev => [...prev, authorId]);
    }
  };

  const getFilteredPosts = () => {
    let filtered = posts;

    // Filter by feed type
    if (feedType === 'following') {
      filtered = posts.filter(post => following.includes(post.authorId));
    } else if (feedType === 'trending') {
      // Sort by engagement (likes + comments + reposts)
      filtered = [...posts].sort((a, b) => {
        const aEngagement = (a.likes?.length || 0) + (a.comments?.length || 0) + (a.reposts?.length || 0);
        const bEngagement = (b.likes?.length || 0) + (b.comments?.length || 0) + (b.reposts?.length || 0);
        return bEngagement - aEngagement;
      });
    }

    // Filter by post type
    if (filterType !== 'all') {
      filtered = filtered.filter(post => post.type === filterType);
    }

    return filtered;
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

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    
    try {
      // Delete the post document
      await deleteDoc(doc(db, 'posts', postToDelete.id));
      
      // Close modal and reset
      setShowDeleteModal(false);
      setPostToDelete(null);
      
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const filteredPosts = getFilteredPosts();

  const handleUserClick = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-white text-gray-900 px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Main Feed */}
            <div className="lg:col-span-3 space-y-6">
              {/* Post creation form */}
              <form className="card p-4 sm:p-6 flex flex-col gap-4 animate-fade-in-up" onSubmit={handlePost}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gold-950 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                    {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm sm:text-base">{user?.displayName || user?.email?.split('@')[0] || 'User'}</div>
                    <div className="text-xs text-gray-600 capitalize">{userRole || 'Member'}</div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
                  <select
                    className="input-field w-full sm:w-48 text-sm"
                    value={postType}
                    onChange={e => setPostType(e.target.value)}
                  >
                    {POST_TYPES.map(pt => (
                      <option key={pt.value} value={pt.value}>
                        {pt.label}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input-field flex-1 text-sm"
                    type="text"
                    placeholder="Share your thoughts, milestones, or questions... (optional)"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    maxLength={500}
                    disabled={posting}
                  />
                                     <button className="btn-primary px-4 sm:px-6 py-2 sm:py-3 text-sm w-full sm:w-auto" type="submit" disabled={posting}>
                     {posting ? (uploadingImages ? 'Compressing...' : 'Posting...') : (images.length > 0 && !content.trim() ? 'Post Images' : 'Post')}
                   </button>
                </div>

                {/* Image upload section */}
                <div className="space-y-3">
                  {/* Image upload button */}
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                        className="hidden"
                        disabled={posting || images.length >= 4}
                      />
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                                                 <span className="text-sm">
                           {uploadingImages ? 'Compressing...' : `Add Images (${images.length}/4)`}
                         </span>
                      </div>
                    </label>
                    {images.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          // Revoke all object URLs before clearing
                          imageUrls.forEach(url => {
                            if (url.startsWith('blob:')) {
                              URL.revokeObjectURL(url);
                            }
                          });
                          setImages([]);
                          setImageUrls([]);
                        }}
                        className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Image previews */}
                  {imageUrls.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </form>

              {/* Feed type tabs */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {FEED_TYPES.map(ft => (
                  <button
                    key={ft.value}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                      feedType === ft.value ? 'bg-gold-950 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setFeedType(ft.value)}
                  >
                    {ft.value === 'all' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                      </svg>
                    )}
                    {ft.value === 'following' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    )}
                    {ft.value === 'trending' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                    {ft.label}
                  </button>
                ))}
              </div>

              {/* Filter tabs */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                <button
                  className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                    filterType === 'all' ? 'bg-gold-950 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setFilterType('all')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  All Posts
                </button>
                {POST_TYPES.map(pt => (
                  <button
                    key={pt.value}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                      filterType === pt.value ? 'bg-gold-950 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setFilterType(pt.value)}
                  >
                    {getPostTypeIcon(pt.value)}
                    {pt.label}
                  </button>
                ))}
              </div>

              {/* Posts feed */}
              <div className="flex flex-col gap-4 sm:gap-6">
                {loading ? (
                  <div className="text-gray-600 text-center py-8">Loading feed...</div>
                ) : filteredPosts.length === 0 ? (
                  <div className="text-gray-600 text-center py-8">
                    {feedType === 'following' ? 'No posts from people you follow. Try following some users!' : 'No posts yet. Be the first to share!'}
                  </div>
                ) : filteredPosts.map(post => (
                  <div key={post.id} className="card p-4 sm:p-6 animate-fade-in-up">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gold-950 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm sm:text-base">
                        {post.author?.[0] || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <button
                            onClick={() => handleUserClick(post.authorId)}
                            className="font-semibold text-gray-900 hover:text-gold-950 transition-colors text-sm sm:text-base"
                          >
                            {post.author}
                          </button>
                          <span className="text-xs text-gray-600 capitalize">{post.authorRole || 'Member'}</span>
                          <span className="text-lg sm:text-xl">{getPostTypeIcon(post.type)}</span>
                          <span className="ml-auto text-xs text-gray-600">
                            {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : 'now'}
                          </span>
                          {/* Delete button for post owner */}
                          {user && post.authorId === user.uid && (
                            <button
                              onClick={() => {
                                setPostToDelete(post);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-500 hover:text-red-700 text-sm ml-2"
                              title="Delete post"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                        <div className="text-gray-800 text-left leading-relaxed text-sm sm:text-base">
                          {post.content}
                          
                          {/* Display images if present */}
                          {post.images && post.images.length > 0 && (
                            <div className="mt-4">
                              <div className={`grid gap-2 ${
                                post.images.length === 1 ? 'grid-cols-1' :
                                post.images.length === 2 ? 'grid-cols-2' :
                                post.images.length === 3 ? 'grid-cols-3' :
                                'grid-cols-2 sm:grid-cols-4'
                              }`}>
                                {post.images.map((imageUrl, index) => (
                                  <div key={index} className="relative group">
                                    <img
                                      src={imageUrl}
                                      alt={`Post image ${index + 1}`}
                                      className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => {
                                        // Image modal functionality removed
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                                                     {post.type === 'opportunity' && post.opportunityId && (
                             <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-4 border-gold-950">
                               <div className="flex items-center gap-2 mb-2">
                                 <span className="text-gold-950">💼</span>
                                 <span className="font-semibold text-sm">Opportunity</span>
                               </div>
                               <div className="text-sm text-gray-700">
                                 Click to view full opportunity details and apply
                               </div>
                               <button 
                                 onClick={() => window.open(`/opportunities?opportunity=${post.opportunityId}`, '_blank')}
                                 className="mt-2 btn-secondary text-xs"
                               >
                                 View Opportunity Details
                               </button>
                             </div>
                           )}
                        </div>
                      </div>
                      {/* Follow button */}
                      {user && post.authorId !== user.uid && (
                        <button
                          onClick={() => handleFollow(post.authorId)}
                          className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                            following.includes(post.authorId)
                              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              : 'bg-gold-950 text-white hover:bg-gold-900'
                          }`}
                        >
                          {following.includes(post.authorId) ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                    
                    <div className="flex gap-4 sm:gap-8 text-gray-600 text-sm border-t border-gray-200 pt-4">
                      <button
                        className={`flex items-center gap-2 hover:text-gold-950 transition-colors ${
                          post.likes?.includes(user?.uid) ? 'text-gold-950 font-semibold' : ''
                        }`}
                        onClick={() => handleLike(post)}
                        disabled={!user}
                      >
                        <svg className="w-5 h-5" fill={post.likes?.includes(user?.uid) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{post.likes?.length || 0}</span>
                      </button>
                      <button
                        className="flex items-center gap-2 hover:text-gold-950 transition-colors"
                        onClick={() => setCommentPost(post)}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{post.comments?.length || 0}</span>
                      </button>
                      <button
                        className={`flex items-center gap-2 hover:text-gold-950 transition-colors ${
                          post.reposts?.includes(user?.uid) ? 'text-gold-950 font-semibold' : ''
                        }`}
                        onClick={() => handleRepost(post)}
                        disabled={!user}
                      >
                        <svg className="w-5 h-5" fill={post.reposts?.includes(user?.uid) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        <span>{post.reposts?.length || 0}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <WhoToFollow />
            </div>
          </div>
        </div>

        <CommentModal post={commentPost} open={!!commentPost} onClose={() => setCommentPost(null)} />

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Post</h3>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPostToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePost}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AuthGuard>
  );
} 