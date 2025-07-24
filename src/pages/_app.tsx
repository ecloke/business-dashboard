import React, { ErrorInfo } from 'react';
import type { AppProps } from 'next/app';
import { ErrorBoundary } from 'react-error-boundary';
import '../styles/globals.css';


// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div 
      role="alert" 
      style={{
        padding: '24px',
        margin: '24px',
        border: '1px solid #ff4d4f',
        borderRadius: '8px',
        backgroundColor: '#fff2f0',
        textAlign: 'center'
      }}
    >
      <h2 style={{ color: '#ff4d4f', marginBottom: '16px' }}>
        Something went wrong
      </h2>
      <p style={{ color: '#262626', marginBottom: '16px' }}>
        {error.message}
      </p>
      <button
        onClick={resetErrorBoundary}
        style={{
          padding: '8px 16px',
          backgroundColor: '#1890ff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        Try again
      </button>
      <details style={{ marginTop: '16px', textAlign: 'left' }}>
        <summary style={{ cursor: 'pointer', color: '#8c8c8c' }}>
          Error details
        </summary>
        <pre style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '12px', 
          borderRadius: '4px',
          fontSize: '12px',
          overflow: 'auto',
          marginTop: '8px'
        }}>
          {error.stack}
        </pre>
      </details>
    </div>
  );
}

// Error logging function
function logError(error: Error, errorInfo: ErrorInfo) {
  console.error('Dashboard Error:', {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack || 'Unknown',
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
    url: typeof window !== 'undefined' ? window.location.href : 'SSR'
  });

  // In production, you might want to send this to an error tracking service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with error tracking service (e.g., Sentry, LogRocket)
    // errorTrackingService.captureException(error, { extra: errorInfo });
  }
}

// Main App component
export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={logError}
      onReset={() => {
        // Clear any cached state that might be causing the error
        if (typeof window !== 'undefined') {
          // Clear localStorage dashboard cache on error
          try {
            localStorage.removeItem('dashboard_cache');
            localStorage.removeItem('dashboard_error_count');
          } catch (e) {
            console.warn('Failed to clear localStorage:', e);
          }
          
          // Reload the page as a last resort
          window.location.reload();
        }
      }}
    >
      <div className="app-container">
        <Component {...pageProps} />
      </div>
    </ErrorBoundary>
  );
}