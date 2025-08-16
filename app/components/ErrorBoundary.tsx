"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-midnight-950 text-support px-4">
          <div className="max-w-md w-full text-center">
            <div className="text-6xl mb-4">😵</div>
            <h1 className="text-2xl font-bold text-gold-950 mb-4">Oops! Something went wrong</h1>
            <p className="text-support/80 mb-6">
              We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary w-full"
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.history.back()}
                className="btn-secondary w-full"
              >
                Go Back
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-support/60 text-sm">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 p-3 bg-midnight-800 rounded text-xs text-red-400 overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Error message component for specific error states
export function ErrorMessage({ 
  title = 'Error', 
  message, 
  onRetry 
}: { 
  title?: string; 
  message: string; 
  onRetry?: () => void; 
}) {
  return (
    <div className="text-center py-8">
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-gold-950 mb-2">{title}</h3>
      <p className="text-support/80 mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary">
          Try Again
        </button>
      )}
    </div>
  );
}

// Network error component
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorMessage
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
    />
  );
}

// Not found component
export function NotFound({ message = "The page you're looking for doesn't exist." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-midnight-950 text-support px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gold-950 mb-4">Page Not Found</h1>
        <p className="text-support/80 mb-6">{message}</p>
        <a href="/" className="btn-primary">
          Go Home
        </a>
      </div>
    </div>
  );
}
