// src/components/ErrorBoundary.tsx
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('Quizly ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#F9FAFB', fontFamily: "'Inter', sans-serif", padding: 24,
        }}>
          <div style={{ textAlign: 'center', maxWidth: 480 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: '#FEE2E2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: 28,
            }}>
              ⚡
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 10 }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 28, lineHeight: 1.6 }}>
              Quizly hit an unexpected error. This has been noted.
              Try refreshing the page — that usually fixes it.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: '#FF5C1A', color: '#FFFFFF', border: 'none',
                  borderRadius: 10, padding: '12px 28px',
                  fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Refresh Page
              </button>
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
                style={{
                  background: '#F3F4F6', color: '#374151', border: 'none',
                  borderRadius: 10, padding: '12px 28px',
                  fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
