"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import app from '../../src/firebase';
import RoleSelectionModal from '../components/RoleSelectionModal';

export default function LoginPage() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [newUser, setNewUser] = useState<any>(null);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setFormError('');
    
    try {
      console.log('Starting Google authentication...');
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      
      console.log('Opening Google popup...');
      // Force account selection - more aggressive approach
      provider.setCustomParameters({
        prompt: 'select_account',
        access_type: 'offline',
        include_granted_scopes: 'true'
      });
      const result = await signInWithPopup(auth, provider);
      console.log('Google sign-in successful:', result.user.uid);
      
      // Check if user already exists in Firestore
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../../src/firebase');
      
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        // New user - show role selection modal
        console.log('New Google user, showing role selection...');
        setNewUser(result.user);
        setShowRoleSelection(true);
      } else {
        // Existing user - check if they have a role
        const userData = userDoc.data();
        console.log('Existing user data:', userData);
        console.log('User email:', result.user.email);
        console.log('User role:', userData.role);
        
        if (!userData.role) {
          // User exists but no role - show role selection
          console.log('User exists but no role, showing role selection...');
          setNewUser(result.user);
          setShowRoleSelection(true);
        } else {
          // User exists with role - redirect to dashboard
          console.log('Existing user with role found, redirecting...');
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      console.error('Google auth error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setFormError('Sign-in was cancelled. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setFormError('Pop-up was blocked. Please allow pop-ups and try again.');
      } else {
        setFormError(`Google sign-in failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRoleSelectionComplete = () => {
    setShowRoleSelection(false);
    setNewUser(null);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-900">
      <div className="card p-8 max-w-md w-full text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gold-950 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-xl">F</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to Foundic
          </h1>
        </div>
        <p className="mb-8 text-gray-600 text-lg">
          The cleanest, most trusted space for startup founders, co-founders, and investors.
        </p>
        
        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="btn-primary w-full mb-6 flex items-center justify-center gap-3 text-lg py-4"
        >
          {googleLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Signing in with Google...
            </>
          ) : (
            <>
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>
        
        <div className="text-sm text-gray-500">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy.</p>
          <p className="mt-2">Only real Gmail accounts can sign in.</p>
        </div>
        
        {formError && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{formError}</p>
          </div>
        )}
      </div>

      {/* Role Selection Modal */}
      {showRoleSelection && newUser && (
        <RoleSelectionModal 
          user={newUser} 
          onComplete={handleRoleSelectionComplete}
        />
      )}
    </main>
  );
} 