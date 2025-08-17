"use client";

import { useState, useEffect } from 'react';

const MESSAGE_COUNT_KEY = 'foundic_last_seen_messages';

export const useMessageCount = (userId: string | undefined) => {
  const [lastSeenMessageTime, setLastSeenMessageTime] = useState<Date>(new Date());

  useEffect(() => {
    if (!userId) return;

    // Load last seen message time from localStorage
    const stored = localStorage.getItem(`${MESSAGE_COUNT_KEY}_${userId}`);
    if (stored) {
      try {
        const parsedTime = new Date(stored);
        setLastSeenMessageTime(parsedTime);
      } catch (error) {
        console.error('Error parsing stored message time:', error);
      }
    }
  }, [userId]);

  const updateLastSeenMessageTime = (time?: Date) => {
    const newTime = time || new Date();
    setLastSeenMessageTime(newTime);
    
    if (userId) {
      localStorage.setItem(`${MESSAGE_COUNT_KEY}_${userId}`, newTime.toISOString());
    }
  };

  return {
    lastSeenMessageTime,
    updateLastSeenMessageTime,
  };
};
