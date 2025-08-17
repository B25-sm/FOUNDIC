"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '../../../src/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AuthGuard from '../../components/AuthGuard';
import toast from 'react-hot-toast';

interface ProfileData {
  displayName: string;
  role: string;
  bio: string;
  location: string;
  company: string;
  position: string;
  industry: string;
  experience: string;
  education: string;
  skills: string[];
  website: string;
  linkedin: string;
  twitter: string;
  instagram: string;
  github: string;
  portfolio: string;
  resume: string;
  whatsapp: string;
  facebook: string;
  profilePicture: string;
}

export default function EditProfilePage() {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    role: '',
    bio: '',
    location: '',
    company: '',
    position: '',
    industry: '',
    experience: '',
    education: '',
    skills: [],
    website: '',
    linkedin: '',
    twitter: '',
    instagram: '',
    github: '',
    portfolio: '',
    resume: '',
    whatsapp: '',
    facebook: '',
    profilePicture: ''
  });

  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileData({
            displayName: data.displayName || user.displayName || '',
            role: data.role || '',
            bio: data.bio || '',
            location: data.location || '',
            company: data.company || '',
            position: data.position || '',
            industry: data.industry || '',
            experience: data.experience || '',
            education: data.education || '',
            skills: data.skills || [],
            website: data.website || '',
            linkedin: data.linkedin || '',
            twitter: data.twitter || '',
            instagram: data.instagram || '',
            github: data.github || '',
            portfolio: data.portfolio || '',
            resume: data.resume || '',
            whatsapp: data.whatsapp || '',
            facebook: data.facebook || '',
            profilePicture: data.profilePicture || ''
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      console.log('No file selected or user not authenticated');
      return;
    }

    console.log('Starting profile picture upload:', { fileName: file.name, fileSize: file.size, fileType: file.type });

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `profile-pictures/${user.uid}_${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);

      console.log('Uploading to Firebase Storage:', fileName);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('Upload successful, download URL:', downloadURL);

      // Update profile data locally
      setProfileData(prev => ({
        ...prev,
        profilePicture: downloadURL
      }));

      // Immediately save to Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        profilePicture: downloadURL,
        updatedAt: new Date()
      });

      console.log('Profile picture saved to Firestore');
      toast.success('Profile picture uploaded and saved successfully!');
      
    } catch (error) {
      console.error('Error uploading image:', error);
      
      // More detailed error handling
      if (error instanceof Error) {
        if (error.message.includes('CORS') || 
            error.message.includes('Access-Control-Allow-Origin') ||
            error.message.includes('blocked by CORS policy')) {
          toast.error('CORS configuration issue. Please contact support.');
          console.error('CORS error detected. Run: gsutil cors set cors.json gs://foundic-77bc6.appspot.com');
        } else if (error.message.includes('storage/unauthorized')) {
          toast.error('Permission denied. Please check Firebase Storage rules.');
        } else if (error.message.includes('storage/canceled')) {
          toast.error('Upload was canceled. Please try again.');
        } else if (error.message.includes('storage/quota-exceeded')) {
          toast.error('Storage quota exceeded. Please contact support.');
        } else {
          toast.error(`Upload failed: ${error.message}`);
        }
      } else {
        toast.error('Failed to upload profile picture. Please try again.');
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setSaved(false);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: profileData.displayName,
        role: profileData.role,
        bio: profileData.bio,
        location: profileData.location,
        company: profileData.company,
        position: profileData.position,
        industry: profileData.industry,
        experience: profileData.experience,
        education: profileData.education,
        skills: profileData.skills,
        website: profileData.website,
        linkedin: profileData.linkedin,
        twitter: profileData.twitter,
        instagram: profileData.instagram,
        github: profileData.github,
        portfolio: profileData.portfolio,
        resume: profileData.resume,
        whatsapp: profileData.whatsapp,
        facebook: profileData.facebook,
        profilePicture: profileData.profilePicture,
        updatedAt: new Date()
      });

      setSaved(true);
      toast.success('Profile updated successfully!');
      
      // Reset saved state after 2 seconds
      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
      setProfileData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleInputChange = (field: keyof ProfileData, value: string | string[]) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-support">Edit Profile</h1>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                saved 
                  ? 'bg-green-600 text-white' 
                  : 'bg-teal-950 text-midnight-950 hover:bg-teal-900'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-midnight-950"></div>
                  Saving...
                </span>
              ) : saved ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved!
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Profile Picture */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-support mb-4">Profile Picture</h2>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {profileData.profilePicture ? (
                      <img
                        src={profileData.profilePicture}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border-2 border-teal-950"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-teal-950 rounded-full flex items-center justify-center text-midnight-950 font-bold text-2xl">
                        {profileData.displayName?.[0] || user?.displayName?.[0] || user?.email?.[0] || 'U'}
                      </div>
                    )}
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-950"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="px-4 py-2 bg-midnight-800 text-support rounded-lg hover:bg-midnight-700 transition-colors disabled:opacity-50"
                    >
                      {uploadingImage ? 'Uploading...' : 'Upload Photo'}
                    </button>
                    <p className="text-xs text-support/60 mt-1">JPG, PNG up to 5MB</p>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-support mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-support/80 mb-2">Display Name</label>
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                      className="w-full px-3 py-2 bg-midnight-800 border border-midnight-700 rounded-lg text-support placeholder-support/50 focus:outline-none focus:ring-2 focus:ring-teal-950"
                      placeholder="Your display name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-support/80 mb-2">Role</label>
                    <select
                      value={profileData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className="w-full px-3 py-2 bg-midnight-800 border border-midnight-700 rounded-lg text-support focus:outline-none focus:ring-2 focus:ring-teal-950"
                    >
                      <option value="">Select your role</option>
                      <option value="founder">Founder</option>
                      <option value="investor">Investor</option>
                      <option value="freelancer">Freelancer</option>
                      <option value="hirer">Hirer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-support/80 mb-2">Location</label>
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-3 py-2 bg-midnight-800 border border-midnight-700 rounded-lg text-support placeholder-support/50 focus:outline-none focus:ring-2 focus:ring-teal-950"
                      placeholder="City, Country"
                    />
                  </div>
                </div>
              </div>

              {/* About */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-support mb-4">About</h2>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-midnight-800 border border-midnight-700 rounded-lg text-support placeholder-support/50 focus:outline-none focus:ring-2 focus:ring-teal-950 resize-none"
                  placeholder="Tell us about yourself, your background, and what you're working on..."
                />
              </div>

              {/* Professional Information */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-support mb-4">Professional Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-support/80 mb-2">Company</label>
                    <input
                      type="text"
                      value={profileData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="w-full px-3 py-2 bg-midnight-800 border border-midnight-700 rounded-lg text-support placeholder-support/50 focus:outline-none focus:ring-2 focus:ring-teal-950"
                      placeholder="Your company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-support/80 mb-2">Position</label>
                    <input
                      type="text"
                      value={profileData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      className="w-full px-3 py-2 bg-midnight-800 border border-midnight-700 rounded-lg text-support placeholder-support/50 focus:outline-none focus:ring-2 focus:ring-teal-950"
                      placeholder="Your job title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-support/80 mb-2">Industry</label>
                    <input
                      type="text"
                      value={profileData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="w-full px-3 py-2 bg-midnight-800 border border-midnight-700 rounded-lg text-support placeholder-support/50 focus:outline-none focus:ring-2 focus:ring-teal-950"
                      placeholder="e.g., Technology, Healthcare, Finance"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Skills */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-support mb-4">Skills</h2>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      className="flex-1 px-3 py-2 bg-midnight-800 border border-midnight-700 rounded-lg text-support placeholder-support/50 focus:outline-none focus:ring-2 focus:ring-teal-950"
                      placeholder="Add a skill"
                    />
                    <button
                      onClick={addSkill}
                      className="px-4 py-2 bg-teal-950 text-midnight-950 rounded-lg hover:bg-teal-900 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="flex items-center gap-2 px-3 py-1 bg-teal-950/20 text-teal-950 rounded-full text-sm"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="text-teal-950 hover:text-teal-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-support mb-4">Social & Professional Links</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-support/80 mb-2">🌐 Website</label>
                    <input
                      type="url"
                      value={profileData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full px-3 py-2 bg-midnight-800 border border-midnight-700 rounded-lg text-support placeholder-support/50 focus:outline-none focus:ring-2 focus:ring-teal-950"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-support/80 mb-2">💼 LinkedIn</label>
                    <input
                      type="url"
                      value={profileData.linkedin}
                      onChange={(e) => handleInputChange('linkedin', e.target.value)}
                      className="w-full px-3 py-2 bg-midnight-800 border border-midnight-700 rounded-lg text-support placeholder-support/50 focus:outline-none focus:ring-2 focus:ring-teal-950"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-support/80 mb-2">🐦 X (Twitter)</label>
                    <input
                      type="url"
                      value={profileData.twitter}
                      onChange={(e) => handleInputChange('twitter', e.target.value)}
                      className="w-full px-3 py-2 bg-midnight-800 border border-midnight-700 rounded-lg text-support placeholder-support/50 focus:outline-none focus:ring-2 focus:ring-teal-950"
                      placeholder="https://twitter.com/yourhandle"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-support/80 mb-2">📷 Instagram</label>
                    <input
                      type="url"
                      value={profileData.instagram}
                      onChange={(e) => handleInputChange('instagram', e.target.value)}
                      className="w-full px-3 py-2 bg-midnight-800 border border-midnight-700 rounded-lg text-support placeholder-support/50 focus:outline-none focus:ring-2 focus:ring-teal-950"
                      placeholder="https://instagram.com/yourhandle"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-support/80 mb-2">💻 GitHub</label>
                    <input
                      type="url"
                      value={profileData.github}
                      onChange={(e) => handleInputChange('github', e.target.value)}
                      className="w-full px-3 py-2 bg-midnight-800 border border-midnight-700 rounded-lg text-support placeholder-support/50 focus:outline-none focus:ring-2 focus:ring-teal-950"
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-support/80 mb-2">🎨 Portfolio</label>
                    <input
                      type="url"
                      value={profileData.portfolio}
                      onChange={(e) => handleInputChange('portfolio', e.target.value)}
                      className="w-full px-3 py-2 bg-midnight-800 border border-midnight-700 rounded-lg text-support placeholder-support/50 focus:outline-none focus:ring-2 focus:ring-teal-950"
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-support/80 mb-2">📄 Resume</label>
                    <input
                      type="url"
                      value={profileData.resume}
                      onChange={(e) => handleInputChange('resume', e.target.value)}
                      className="w-full px-3 py-2 bg-midnight-800 border border-midnight-700 rounded-lg text-support placeholder-support/50 focus:outline-none focus:ring-2 focus:ring-teal-950"
                      placeholder="https://link-to-your-resume.pdf"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-support/80 mb-2">📱 WhatsApp</label>
                    <input
                      type="tel"
                      value={profileData.whatsapp}
                      onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                      className="w-full px-3 py-2 bg-midnight-800 border border-midnight-700 rounded-lg text-support placeholder-support/50 focus:outline-none focus:ring-2 focus:ring-teal-950"
                      placeholder="+1234567890 (with country code)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-support/80 mb-2">📘 Facebook</label>
                    <input
                      type="url"
                      value={profileData.facebook}
                      onChange={(e) => handleInputChange('facebook', e.target.value)}
                      className="w-full px-3 py-2 bg-midnight-800 border border-midnight-700 rounded-lg text-support placeholder-support/50 focus:outline-none focus:ring-2 focus:ring-teal-950"
                      placeholder="https://facebook.com/yourprofile"
                    />
                  </div>
                </div>
              </div>

              {/* Experience & Education */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-support mb-4">Experience & Education</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-support/80 mb-2">Experience</label>
                    <textarea
                      value={profileData.experience}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-midnight-800 border border-midnight-700 rounded-lg text-support placeholder-support/50 focus:outline-none focus:ring-2 focus:ring-teal-950 resize-none"
                      placeholder="Brief overview of your experience..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-support/80 mb-2">Education</label>
                    <textarea
                      value={profileData.education}
                      onChange={(e) => handleInputChange('education', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-midnight-800 border border-midnight-700 rounded-lg text-support placeholder-support/50 focus:outline-none focus:ring-2 focus:ring-teal-950 resize-none"
                      placeholder="Your educational background..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
