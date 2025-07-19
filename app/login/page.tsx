"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../src/firebase';
import { useSignInWithGoogle, useSignInWithEmailAndPassword, useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import app from '../../src/firebase';

const db = getFirestore(app);
const ROLES = [
  { value: 'founder', label: 'Founder' },
  { value: 'investor', label: 'Investor' },
  { value: 'admin', label: 'Admin' },
];

const ADMIN_EMAILS = [
  'saimahendra222@gmail.com',
  'mahendra10kcoders@gmail.com',
];

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(ROLES[0].value);
  const [signInWithGoogle, userGoogle, loadingGoogle, errorGoogle] = useSignInWithGoogle(auth);
  const [signInWithEmailAndPassword, userEmail, loadingEmail, errorEmail] = useSignInWithEmailAndPassword(auth);
  const [createUserWithEmailAndPassword, userCreate, loadingCreate, errorCreate] = useCreateUserWithEmailAndPassword(auth);
  const [formError, setFormError] = useState('');

  React.useEffect(() => {
    const user = userGoogle || userEmail || userCreate;
    if (user) {
      router.push('/dashboard');
    }
  }, [userGoogle, userEmail, userCreate, router]);

  // Save role to Firestore on sign up
  React.useEffect(() => {
    if (userCreate && isSignUp) {
      setDoc(doc(db, 'users', userCreate.user.uid), {
        email: userCreate.user.email,
        role,
        createdAt: new Date(),
      }, { merge: true });
    }
  }, [userCreate, isSignUp, role]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }
    if (isSignUp) {
      await createUserWithEmailAndPassword(email, password);
    } else {
      await signInWithEmailAndPassword(email, password);
    }
  };

  const allowedRoles = isSignUp && ADMIN_EMAILS.includes(email.trim().toLowerCase())
    ? ROLES
    : ROLES.filter(r => r.value !== 'admin');

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-midnight-950 text-support">
      <div className="card p-8 max-w-md w-full text-center animate-fade-in-up">
        <h1 className="text-3xl font-bold gradient-text mb-4">
          {isSignUp ? 'Create your Foundic account' : 'Sign In to Foundic'}
        </h1>
        <p className="mb-6 text-support/80">
          {isSignUp ? 'Join the cleanest founder community. Start your journey!' : 'Access your dashboard, connect with co-founders, and join mission pods.'}
        </p>
        <button
          className="btn-primary w-full flex items-center justify-center gap-2 mb-4"
          onClick={() => signInWithGoogle()}
          disabled={loadingGoogle}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_17_40)"><path d="M47.5 24.5C47.5 22.6 47.3 20.8 47 19H24.5V29.1H37.3C36.7 32.1 34.7 34.6 31.8 36.2V42.1H39.3C44 38 47.5 31.9 47.5 24.5Z" fill="#4285F4"/><path d="M24.5 48C31.1 48 36.7 45.8 39.3 42.1L31.8 36.2C30.3 37.2 28.5 37.8 26.5 37.8C20.2 37.8 14.9 33.7 13.1 28.1H5.3V34.2C8.9 41.1 16.1 48 24.5 48Z" fill="#34A853"/><path d="M13.1 28.1C12.6 27.1 12.3 26 12.3 24.9C12.3 23.8 12.6 22.7 13.1 21.7V15.6H5.3C3.7 18.6 2.7 21.9 2.7 24.9C2.7 27.9 3.7 31.2 5.3 34.2L13.1 28.1Z" fill="#FBBC05"/><path d="M24.5 12.1C27.1 12.1 29.4 13 31.2 14.7L38.1 8.1C34.7 4.9 29.9 2.7 24.5 2.7C16.1 2.7 8.9 9.6 5.3 15.6L13.1 21.7C14.9 16.1 20.2 12.1 24.5 12.1Z" fill="#EA4335"/></g><defs><clipPath id="clip0_17_40"><rect width="48" height="48" fill="white"/></clipPath></defs></svg>
          {loadingGoogle ? 'Signing in...' : 'Sign in with Google'}
        </button>
        <form className="flex flex-col gap-3" onSubmit={handleEmailAuth}>
          <input
            className="input-field"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            className="input-field"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            required
          />
          {isSignUp && (
            <select
              className="input-field"
              value={role}
              onChange={e => setRole(e.target.value)}
              required
            >
              {allowedRoles.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          )}
          <button
            className="btn-secondary w-full mt-2"
            type="submit"
            disabled={loadingEmail || loadingCreate}
          >
            {isSignUp
              ? loadingCreate ? 'Creating account...' : 'Sign Up with Email'
              : loadingEmail ? 'Signing in...' : 'Sign In with Email'}
          </button>
        </form>
        {(formError || errorGoogle || errorEmail || errorCreate) && (
          <div className="mt-4 text-error-500 text-sm">
            {formError || errorGoogle?.message || errorEmail?.message || errorCreate?.message}
          </div>
        )}
        <div className="mt-6 text-support/60 text-xs">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <button className="text-gold-950 font-semibold" onClick={() => setIsSignUp(false)}>Sign In</button>
            </>
          ) : (
            <>
              Don’t have an account?{' '}
              <button className="text-gold-950 font-semibold" onClick={() => setIsSignUp(true)}>Sign Up</button>
            </>
          )}
        </div>
      </div>
    </main>
  );
} 