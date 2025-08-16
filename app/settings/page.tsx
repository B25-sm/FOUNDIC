"use client";

import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../src/firebase';
import { doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import AuthGuard from '../components/AuthGuard';
import { useTheme } from '../components/ThemeProvider';
import toast from 'react-hot-toast';

interface UserSettings {
  theme: 'dark' | 'light';
  emailNotifications: boolean;
  pushNotifications: boolean;
  profileVisibility: 'public' | 'private';
  language: string;
  timezone: string;
}

const DELETE_REASONS = [
  'I created a new account',
  'I no longer need this account',
  'I have privacy concerns',
  'I found the platform confusing',
  'I received unwanted messages',
  'I want to start fresh',
  'Other'
];

export default function SettingsPage() {
  const [user] = useAuthState(auth);
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'dark',
    emailNotifications: true,
    pushNotifications: true,
    profileVisibility: 'public',
    language: 'en',
    timezone: 'UTC'
  });

  useEffect(() => {
    if (user) {
      loadUserSettings();
    }
  }, [user]);

  const loadUserSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userSettings = userData.settings || {};
        
        const userTheme = userSettings.theme || 'dark';
        setSettings({
          theme: userTheme,
          emailNotifications: userSettings.emailNotifications !== false,
          pushNotifications: userSettings.pushNotifications !== false,
          profileVisibility: userSettings.profileVisibility || 'public',
          language: userSettings.language || 'en',
          timezone: userSettings.timezone || 'UTC'
        });
        
        // Sync with theme context
        if (userTheme !== theme) {
          setTheme(userTheme);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (key: keyof UserSettings, value: any) => {
    if (!user) return;

    try {
      setSaving(true);
      
      // Update local state
      setSettings(prev => ({ ...prev, [key]: value }));
      
      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        [`settings.${key}`]: value
      });

      // Apply theme change immediately
      if (key === 'theme') {
        setTheme(value);
      }

      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
      
      // Revert local state on error
      setSettings(prev => ({ ...prev, [key]: settings[key] }));
    } finally {
      setSaving(false);
    }
  };



  const handleExportData = () => {
    // Placeholder for data export functionality
    toast.success('Data export feature coming soon!');
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!user || !deleteReason) {
      toast.error('Please select a reason for deletion');
      return;
    }

    // Show password confirmation step
    setShowPasswordConfirm(true);
  };

  const handlePasswordConfirm = async () => {
    if (!user || !password) {
      setPasswordError('Please enter your password');
      return;
    }

    try {
      setDeleting(true);
      setPasswordError('');
      
      // Re-authenticate user with password
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);
      
      // Log deletion reason (for analytics)
      const finalReason = deleteReason === 'Other' ? customReason : deleteReason;
      console.log('Account deletion reason:', finalReason);
      
      // Delete user data from Firestore
      await deleteDoc(doc(db, 'users', user.uid));
      
      // Delete Firebase Auth user
      await deleteUser(user);
      
      toast.success('Account deleted successfully');
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error: any) {
      console.error('Error deleting account:', error);
      if (error.code === 'auth/wrong-password') {
        setPasswordError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error('Please sign in again to delete your account');
      } else {
        toast.error('Failed to delete account. Please try again.');
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setShowPasswordConfirm(false);
    setDeleteReason('');
    setCustomReason('');
    setPassword('');
    setPasswordError('');
  };

  if (loading) {
    return (
      <AuthGuard>
        <main className="min-h-screen bg-midnight-950 text-support px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-950 mx-auto mb-4"></div>
              <p className="text-support/60">Loading settings...</p>
            </div>
          </div>
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white dark:bg-midnight-950 text-gray-900 dark:text-white p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your account preferences and privacy</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Appearance */}
              <div className="card p-6 bg-white dark:bg-midnight-900 border border-gray-200 dark:border-midnight-800">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">🎨 Appearance</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Theme</label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleSettingChange('theme', 'dark')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                          settings.theme === 'dark'
                            ? 'border-gold-950 bg-gold-950/10 text-gold-950'
                            : 'border-gray-300 dark:border-midnight-700 bg-gray-50 dark:bg-midnight-800 text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-midnight-600'
                        }`}
                      >
                        <div className="w-6 h-6 bg-gray-900 dark:bg-white rounded border border-gray-600 dark:border-gray-300"></div>
                        <span>Dark Theme</span>
                      </button>
                      <button
                        onClick={() => handleSettingChange('theme', 'light')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                          settings.theme === 'light'
                            ? 'border-gold-950 bg-gold-950/10 text-gold-950'
                            : 'border-gray-300 dark:border-midnight-700 bg-gray-50 dark:bg-midnight-800 text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-midnight-600'
                        }`}
                      >
                        <div className="w-6 h-6 bg-white rounded border border-gray-300"></div>
                        <span>Light Theme</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="card p-6 bg-white dark:bg-midnight-900 border border-gray-200 dark:border-midnight-800">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">🔔 Notifications</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</label>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Receive updates via email</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('emailNotifications', !settings.emailNotifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.emailNotifications ? 'bg-gold-950' : 'bg-gray-300 dark:bg-midnight-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900 dark:text-white">Push Notifications</label>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Receive browser notifications</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('pushNotifications', !settings.pushNotifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.pushNotifications ? 'bg-gold-950' : 'bg-gray-300 dark:bg-midnight-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Privacy */}
              <div className="card p-6 bg-white dark:bg-midnight-900 border border-gray-200 dark:border-midnight-800">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">🔒 Privacy</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Profile Visibility</label>
                    <select
                      value={settings.profileVisibility}
                      onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="public">Public - Anyone can view your profile</option>
                      <option value="private">Private - Only followers can view your profile</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Regional */}
              <div className="card p-6 bg-white dark:bg-midnight-900 border border-gray-200 dark:border-midnight-800">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">🌍 Regional</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Language</label>
                    <select
                      value={settings.language}
                      onChange={(e) => handleSettingChange('language', e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="hi">हिंदी</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Timezone</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => handleSettingChange('timezone', e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                      <option value="Asia/Kolkata">Mumbai</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Info */}
              <div className="card p-6 bg-white dark:bg-midnight-900 border border-gray-200 dark:border-midnight-800">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">👤 Account</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">Email</label>
                    <p className="text-sm text-gray-900 dark:text-white">{user?.email}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">Display Name</label>
                    <p className="text-sm text-gray-900 dark:text-white">{user?.displayName || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">Account Created</label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {user?.metadata?.creationTime ? 
                        new Date(user.metadata.creationTime).toLocaleDateString() : 
                        'Unknown'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Management */}
              <div className="card p-6 bg-white dark:bg-midnight-900 border border-gray-200 dark:border-midnight-800">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">📊 Data</h2>
                <div className="space-y-3">
                  <button
                    onClick={handleExportData}
                    className="w-full btn-secondary text-sm"
                  >
                    📥 Export My Data
                  </button>
                  <button
                    onClick={() => window.open('/profile', '_blank')}
                    className="w-full btn-secondary text-sm"
                  >
                    👁️ View Profile
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="card p-6 border border-red-800/30">
                <h2 className="text-xl font-semibold text-red-400 mb-4">⚠️ Danger Zone</h2>
                <div className="space-y-3">
                  {/* Hidden Delete Button - Users need to find it */}
                  <div className="group relative">
                    <button
                      onClick={handleDeleteAccount}
                      className="w-full px-4 py-2 bg-transparent border border-transparent text-transparent rounded-lg hover:bg-red-900/10 hover:border-red-800 hover:text-red-400 transition-all duration-300 text-sm opacity-0 group-hover:opacity-100"
                    >
                      🗑️ Delete Account
                    </button>
                    {/* Easter egg hint */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity">
                      <span className="text-xs text-gray-600 dark:text-gray-400">💡 Try hovering here...</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    These actions cannot be undone. Please be careful.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Delete Account Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-midnight-900 border border-midnight-700 rounded-xl p-6 max-w-md w-full">
                <h3 className="text-xl font-semibold text-support mb-4">Delete Account</h3>
                
                {!showPasswordConfirm ? (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      We're sorry to see you go. Please help us improve by telling us why you're leaving.
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Why are you deleting your account?
                        </label>
                        <select
                          value={deleteReason}
                          onChange={(e) => setDeleteReason(e.target.value)}
                          className="input-field w-full"
                        >
                          <option value="">Select a reason</option>
                          {DELETE_REASONS.map((reason) => (
                            <option key={reason} value={reason}>{reason}</option>
                          ))}
                        </select>
                      </div>
                      
                      {deleteReason === 'Other' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Please specify
                          </label>
                          <textarea
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                            placeholder="Tell us more..."
                            className="input-field w-full h-20 resize-none"
                            maxLength={500}
                          />
                        </div>
                      )}
                      
                      <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3">
                        <p className="text-sm text-red-400 font-medium mb-1">⚠️ This action cannot be undone</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          All your data, posts, and account information will be permanently deleted.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={handleDeleteCancel}
                        className="flex-1 btn-secondary text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteConfirm}
                        disabled={!deleteReason}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        Continue
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      For your security, please enter your password to confirm account deletion.
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Password
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="input-field w-full"
                          autoFocus
                        />
                        {passwordError && (
                          <p className="text-sm text-red-400 mt-1">{passwordError}</p>
                        )}
                      </div>
                      
                      <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3">
                        <p className="text-sm text-red-400 font-medium mb-1">⚠️ Final Warning</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          This will permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setShowPasswordConfirm(false)}
                        disabled={deleting}
                        className="flex-1 btn-secondary text-sm"
                      >
                        Back
                      </button>
                      <button
                        onClick={handlePasswordConfirm}
                        disabled={!password || deleting}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        {deleting ? (
                          <span className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Deleting...
                          </span>
                        ) : (
                          'Delete Account'
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Save Status */}
          {saving && (
            <div className="fixed bottom-4 right-4 bg-midnight-900 border border-midnight-700 rounded-lg px-4 py-2 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gold-950"></div>
              <span className="text-sm text-gray-900 dark:text-white">Saving...</span>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
