import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
          backgroundColor: '#1a1a1a'
        }}>
          <h2 style={{ color: '#f87171', fontSize: 24, marginBottom: 16 }}>
            Something went wrong
          </h2>
          <p style={{ color: '#9ca3af', fontSize: 16, textAlign: 'center' }}>
            We're sorry, but something unexpected happened. Please restart the app.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 