"use client";

import { useEffect } from 'react';

export default function HydrationSuppressor() {
  useEffect(() => {
    // Suppress hydration warnings for browser extension attributes
    const originalError = console.error;
    console.error = (...args) => {
      const message = args[0];
      if (
        typeof message === 'string' &&
        (message.includes('Extra attributes from the server') ||
         message.includes('data-new-gr-c-s-check-loaded') ||
         message.includes('data-gr-ext-installed'))
      ) {
        return; // Suppress these specific warnings
      }
      originalError.apply(console, args);
    };

    // Suppress Firebase connection warnings in development
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const message = args[0];
      if (
        typeof message === 'string' &&
        (message.includes('Firestore') && message.includes('offline') ||
         message.includes('WebChannelConnection') ||
         message.includes('Could not reach Cloud Firestore backend'))
      ) {
        return; // Suppress Firebase connection warnings
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return null; // This component doesn't render anything
}
