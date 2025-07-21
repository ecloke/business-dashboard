import React, { ErrorInfo } from 'react';
import type { AppProps } from 'next/app';
import { ConfigProvider, theme } from 'antd';
import { ErrorBoundary } from 'react-error-boundary';
import 'antd/dist/reset.css';
import '../styles/globals.css';

// Ant Design theme configuration matching dashboard.html design
const antdTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    // Color tokens matching the dashboard design
    colorPrimary: '#1890ff', // Primary blue
    colorSuccess: '#52c41a', // Success green
    colorWarning: '#faad14', // Warning orange
    colorError: '#ff4d4f',   // Error red
    colorInfo: '#1890ff',    // Info blue (same as primary)
    
    // Background colors
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f5f5f5',
    
    // Text colors
    colorText: '#262626',
    colorTextSecondary: '#8c8c8c',
    colorTextTertiary: '#bfbfbf',
    colorTextQuaternary: '#f0f0f0',
    
    // Border and shadow
    colorBorder: '#f0f0f0',
    colorBorderSecondary: '#f0f0f0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    boxShadowSecondary: '0 4px 12px rgba(0, 0, 0, 0.15)',
    
    // Border radius
    borderRadius: 8,
    borderRadiusLG: 8,
    borderRadiusSM: 6,
    
    // Font family
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    fontSizeHeading1: 24,
    fontSizeHeading2: 20,
    fontSizeHeading3: 16,
    
    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,
    margin: 16,
    marginLG: 24,
    marginSM: 12,
    marginXS: 8,
  },
  components: {
    // Card component customization
    Card: {
      colorBgContainer: '#ffffff',
      colorBorderSecondary: '#f0f0f0',
      paddingLG: 24,
    },
    // Statistic component for metrics cards
    Statistic: {
      colorTextHeading: '#262626',
      fontSizeHeading2: 32,
      fontSizeHeading3: 16,
    },
    // Table component customization
    Table: {
      colorBgContainer: '#ffffff',
      colorFillAlter: '#fafafa',
      colorBorderSecondary: '#f0f0f0',
    },
    // Button component customization
    Button: {
      colorPrimary: '#1890ff',
      colorPrimaryHover: '#40a9ff',
      colorPrimaryActive: '#096dd9',
      borderRadius: 6,
    },
    // Layout component customization
    Layout: {
      colorBgBody: '#f5f5f5',
      colorBgHeader: '#ffffff',
      colorBgTrigger: '#ffffff',
    },
  },
};

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
      <ConfigProvider theme={antdTheme}>
        <div className="app-container">
          <Component {...pageProps} />
        </div>
      </ConfigProvider>
    </ErrorBoundary>
  );
}