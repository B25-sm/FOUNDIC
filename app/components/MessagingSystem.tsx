"use client";

import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../src/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, doc, getDoc } from 'firebase/firestore';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Timestamp;
  senderName?: string;
}

interface MessagingSystemProps {
  matchId: string;
  matchName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MessagingSystem({ matchId, matchName, isOpen, onClose }: MessagingSystemProps) {
  const [user] = useAuthState(auth);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [matchUser, setMatchUser] = useState<any>(null);

  useEffect(() => {
    if (!isOpen || !user || !matchId) return;

    // Get match user details
    getDoc(doc(db, 'users', matchId)).then(snap => {
      if (snap.exists()) {
        setMatchUser(snap.data());
      }
    });

    // Listen to messages between these two users
    const messagesQuery = query(
      collection(db, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const allMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      // Filter messages between current user and match
      const conversationMessages = allMessages.filter(
        msg => (msg.senderId === user.uid && msg.receiverId === matchId) ||
               (msg.senderId === matchId && msg.receiverId === user.uid)
      );
      setMessages(conversationMessages);
    });

    return () => unsubscribe();
  }, [isOpen, user, matchId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !matchId) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        senderId: user.uid,
        receiverId: matchId,
        content: newMessage.trim(),
        createdAt: Timestamp.now(),
        senderName: user.displayName || user.email || 'You',
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-midnight-900 rounded-lg shadow-xl w-full max-w-md h-96 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-midnight-800">
          <div>
            <h3 className="font-semibold text-support">Message {matchName}</h3>
            <p className="text-xs text-support/60">
              {matchUser?.survey ? 'Active user' : 'New user'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-support/60 hover:text-support transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-support/60 text-sm">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.senderId === user?.uid
                      ? 'bg-gold-950 text-midnight-950'
                      : 'bg-midnight-800 text-support'
                  }`}
                >
                  <div className="font-medium text-xs mb-1">
                    {message.senderId === user?.uid ? 'You' : message.senderName || 'Unknown'}
                  </div>
                  <div>{message.content}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {message.createdAt?.toDate ? 
                      message.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                      : 'now'
                    }
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-midnight-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 input-field text-sm"
              maxLength={500}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="btn-primary text-sm px-4"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
