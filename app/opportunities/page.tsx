"use client";

import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../src/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, getDoc, where, deleteDoc } from 'firebase/firestore';
import AuthGuard from '../components/AuthGuard';
import { createNotification } from '../utils/notifications';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'freelance';
  salary: string;
  requirements: string[];
  authorId: string;
  author: string;
  createdAt: any;
  applicants: string[];
  status: 'open' | 'closed';
}

export default function OpportunitiesPage() {
  const [user] = useAuthState(auth);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [appliedOpportunities, setAppliedOpportunities] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'my-opportunities' | 'applied'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: '',
    location: '',
    type: 'full-time' as const,
    salary: '',
    requirements: ''
  });

  useEffect(() => {
    if (user) {
      loadUserData();
      loadOpportunities();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserRole(userData.role || 'founder');
        setAppliedOpportunities(userData.appliedOpportunities || []);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadOpportunities = () => {
    const q = query(collection(db, 'opportunities'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const opportunitiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Opportunity));
      setOpportunities(opportunitiesData);
      setLoading(false);
    });

    return unsubscribe;
  };

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const requirements = formData.requirements.split(',').map(req => req.trim()).filter(req => req);
      
      const opportunityData = {
        ...formData,
        requirements,
        authorId: user.uid,
        author: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        createdAt: new Date(),
        applicants: [],
        status: 'open' as const
      };

      const opportunityRef = await addDoc(collection(db, 'opportunities'), opportunityData);
      
      // Also create a post in the wall
      await addDoc(collection(db, 'posts'), {
        type: 'opportunity',
        author: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        authorId: user.uid,
        content: `New opportunity: ${formData.title} at ${formData.company}`,
        opportunityId: opportunityRef.id,
        likes: [],
        reposts: [],
        comments: [],
        createdAt: new Date(),
      });

      setFormData({
        title: '',
        description: '',
        company: '',
        location: '',
        type: 'full-time',
        salary: '',
        requirements: ''
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error creating opportunity:', error);
    }
  };

  const handleApply = async (opportunityId: string) => {
    if (!user) return;

    try {
      // Get opportunity details for notification
      const opportunityDoc = await getDoc(doc(db, 'opportunities', opportunityId));
      const opportunityData = opportunityDoc.data();

      // Add user to opportunity applicants
      await updateDoc(doc(db, 'opportunities', opportunityId), {
        applicants: arrayUnion(user.uid)
      });

      // Add opportunity to user's applied opportunities
      await updateDoc(doc(db, 'users', user.uid), {
        appliedOpportunities: arrayUnion(opportunityId)
      });

      // Create notification for opportunity creator
      if (opportunityData && opportunityData.authorId !== user.uid) {
        await createNotification({
          userId: opportunityData.authorId,
          type: 'pod_interest', // Using pod_interest type for opportunity applications
          title: 'New job application',
          message: `Someone applied for your opportunity: "${opportunityData.title}"`,
          actionUserId: user.uid,
          postId: opportunityId,
        });
      }

      setAppliedOpportunities(prev => [...prev, opportunityId]);
    } catch (error) {
      console.error('Error applying for opportunity:', error);
    }
  };

  const handleWithdraw = async (opportunityId: string) => {
    if (!user) return;

    try {
      // Remove user from opportunity applicants
      await updateDoc(doc(db, 'opportunities', opportunityId), {
        applicants: arrayRemove(user.uid)
      });

      // Remove opportunity from user's applied opportunities
      await updateDoc(doc(db, 'users', user.uid), {
        appliedOpportunities: arrayRemove(opportunityId)
      });

      setAppliedOpportunities(prev => prev.filter(id => id !== opportunityId));
    } catch (error) {
      console.error('Error withdrawing from opportunity:', error);
    }
  };

  const handleDelete = async (opportunityId: string) => {
    if (!user) return;

    const confirmDelete = window.confirm('Are you sure you want to delete this opportunity? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      // Delete the opportunity document
      await deleteDoc(doc(db, 'opportunities', opportunityId));
      
      // Remove from local state
      setOpportunities(prev => prev.filter(opp => opp.id !== opportunityId));
      
      console.log('Opportunity deleted successfully');
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      alert('Failed to delete opportunity. Please try again.');
    }
  };

  const getFilteredOpportunities = () => {
    let filtered = opportunities;

    // Apply filter
    if (filter === 'my-opportunities') {
      filtered = opportunities.filter(opportunity => opportunity.authorId === user?.uid);
    } else if (filter === 'applied') {
      filtered = opportunities.filter(opportunity => appliedOpportunities.includes(opportunity.id));
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(opportunity =>
        opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opportunity.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opportunity.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredOpportunities = getFilteredOpportunities();

  return (
    <AuthGuard>
      <main className="min-h-screen bg-white text-gray-900 px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-2">Opportunities Board</h1>
            <p className="text-support/60 text-sm sm:text-base">Find opportunities or post them to connect with talent</p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 sm:mb-8">
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary px-6 py-3 text-sm sm:text-base"
            >
              Post Opportunity
            </button>
            
            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all' ? 'bg-teal-950 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Opportunities
              </button>
              <button
                onClick={() => setFilter('my-opportunities')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'my-opportunities' ? 'bg-teal-950 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                My Opportunities
              </button>
              <button
                onClick={() => setFilter('applied')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'applied' ? 'bg-teal-950 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Applied
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search opportunities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-950 focus:border-transparent"
            />
          </div>

          {/* Opportunities List */}
          <div className="space-y-4 sm:space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-support/60">Loading opportunities...</p>
              </div>
            ) : filteredOpportunities.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">💼</div>
                <p className="text-lg font-medium text-gray-900 mb-2">No opportunities found</p>
                <p className="text-gray-600">
                  {filter === 'my-opportunities' ? 'You haven\'t posted any opportunities yet.' :
                   filter === 'applied' ? 'You haven\'t applied to any opportunities yet.' :
                   'No opportunities found. Be the first to post one!'}
                </p>
              </div>
            ) : (
              filteredOpportunities.map(opportunity => (
                <div key={opportunity.id} className="card p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                            {opportunity.title}
                          </h3>
                          <p className="text-teal-950 font-medium">{opportunity.company}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            opportunity.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {opportunity.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          📍 {opportunity.location}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          ⏰ {opportunity.type}
                        </span>
                        {opportunity.salary && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            💰 {opportunity.salary}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-700 text-sm sm:text-base mb-3">
                        {opportunity.description}
                      </p>
                      
                      {opportunity.requirements.length > 0 && (
                        <div className="mb-3">
                          <h4 className="font-medium text-gray-900 mb-1">Requirements:</h4>
                          <div className="flex flex-wrap gap-1">
                            {opportunity.requirements.map((req, index) => (
                              <span key={index} className="px-2 py-1 bg-teal-50 text-teal-800 rounded text-xs">
                                {req}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Posted by {opportunity.author}</span>
                        <span>{opportunity.createdAt?.toDate ? opportunity.createdAt.toDate().toLocaleDateString() : 'Recently'}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {user && opportunity.authorId !== user.uid && (
                        <button
                          onClick={() => appliedOpportunities.includes(opportunity.id) ? 
                            handleWithdraw(opportunity.id) : handleApply(opportunity.id)
                          }
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            appliedOpportunities.includes(opportunity.id) ? 
                              'bg-red-600 text-white hover:bg-red-700' :
                              'bg-teal-950 text-white hover:bg-teal-900'
                          }`}
                        >
                          {appliedOpportunities.includes(opportunity.id) ? 'Withdraw' : 'Apply'}
                        </button>
                      )}
                      
                      {user && opportunity.authorId === user.uid && (
                        <button
                          onClick={() => handleDelete(opportunity.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2 justify-center"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      )}
                      
                      {opportunity.applicants.length > 0 && (
                        <div className="text-center">
                          <span className="text-sm text-gray-600">
                            {opportunity.applicants.length} applicant{opportunity.applicants.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Opportunity Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Post New Opportunity</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleCreateOpportunity} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-950 focus:border-transparent"
                    placeholder="e.g., Senior Frontend Developer"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-950 focus:border-transparent"
                    placeholder="e.g., Tech Corp"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-950 focus:border-transparent"
                      placeholder="e.g., San Francisco, CA"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-950 focus:border-transparent"
                    >
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="freelance">Freelance</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary/Compensation</label>
                  <input
                    type="text"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-950 focus:border-transparent"
                    placeholder="e.g., $80k - $120k, Equity available"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-950 focus:border-transparent"
                    placeholder="Describe the role, responsibilities, and what you're looking for..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
                  <textarea
                    rows={3}
                    value={formData.requirements}
                    onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-950 focus:border-transparent"
                    placeholder="Enter requirements separated by commas (e.g., React, TypeScript, 3+ years experience)"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-teal-950 text-white rounded-lg hover:bg-teal-900 transition-colors"
                  >
                    Post Opportunity
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
