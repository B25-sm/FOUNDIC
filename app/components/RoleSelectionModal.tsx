"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import app from '../../src/firebase';
import { ROLES, UserRole, getRoleInfo } from '../utils/roles';

interface RoleSelectionModalProps {
  user: any;
  onComplete: () => void;
}

export default function RoleSelectionModal({ user, onComplete }: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      setError('Please select a role to continue.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const db = getFirestore(app);
      
      // Save user data with selected role
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0],
        role: selectedRole,
        createdAt: new Date(),
        fCoins: 0,
        survey: null,
        following: [],
        followers: [],
      });

      console.log(`User role set to: ${selectedRole}`);
      onComplete();
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error saving user role:', err);
      setError('Failed to save your role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md w-full shadow-xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gold-950 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
            {user.displayName?.[0] || user.email?.[0] || 'U'}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Foundic!
          </h2>
          <p className="text-gray-600">
            Please select your role to get started
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {ROLES.filter(role => role.value !== 'admin').map(role => (
            <button
              key={role.value}
              onClick={() => setSelectedRole(role.value)}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                selectedRole === role.value
                  ? 'border-gold-950 bg-gold-950/10 text-gold-950'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{role.icon}</div>
                <div className="text-left">
                  <div className="font-semibold">{role.label}</div>
                  <div className="text-sm text-gray-600">
                    {role.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleRoleSelection}
          disabled={!selectedRole || loading}
          className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Setting up your account...
            </>
          ) : (
            `Continue as ${selectedRole ? getRoleInfo(selectedRole).label : 'User'}`
          )}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          You can change your role later in your profile settings
        </p>
      </div>
    </div>
  );
}
