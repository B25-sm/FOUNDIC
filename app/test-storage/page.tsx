"use client";

import React, { useState } from 'react';
import { storage } from '../../src/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function TestStoragePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult('');
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setResult('');
    setError('');

    try {
      console.log('Starting upload test...');
      console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      // Create a unique filename
      const fileName = `test/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      console.log('Storage reference:', storageRef.fullPath);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      console.log('Upload successful:', snapshot.ref.fullPath);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL:', downloadURL);
      
      setResult(`✅ Upload successful!\nFile: ${fileName}\nURL: ${downloadURL}`);
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(`❌ Upload failed: ${error.code || error.message}\n\nFull error: ${JSON.stringify(error, null, 2)}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-midnight-950 text-support p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gold-950">Firebase Storage Test</h1>
        
        <div className="bg-midnight-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Image Upload</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Image File:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="w-full p-3 border border-midnight-700 rounded-lg bg-midnight-800 text-support"
              />
            </div>
            
            {file && (
              <div className="bg-midnight-800 rounded-lg p-4">
                <p><strong>Selected File:</strong> {file.name}</p>
                <p><strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <p><strong>Type:</strong> {file.type}</p>
              </div>
            )}
            
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-gold-950 text-midnight-950 font-bold py-3 px-6 rounded-lg hover:bg-gold-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Test Upload'}
            </button>
          </div>
        </div>
        
        {result && (
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-6">
            <h3 className="text-green-400 font-semibold mb-2">✅ Success</h3>
            <pre className="text-sm text-green-300 whitespace-pre-wrap">{result}</pre>
          </div>
        )}
        
        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
            <h3 className="text-red-400 font-semibold mb-2">❌ Error</h3>
            <pre className="text-sm text-red-300 whitespace-pre-wrap">{error}</pre>
          </div>
        )}
        
        <div className="bg-midnight-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Storage Bucket:</strong> foundic-77bc6.appspot.com</p>
            <p><strong>Project ID:</strong> foundic-77bc6</p>
            <p><strong>Authentication:</strong> Required (Blaze plan)</p>
            <p><strong>Rules:</strong> Allow authenticated users to read/write</p>
          </div>
        </div>
      </div>
    </div>
  );
}
