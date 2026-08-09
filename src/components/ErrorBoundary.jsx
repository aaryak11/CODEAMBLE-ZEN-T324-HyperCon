import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Demo Error Boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-surface rounded-xl border-3 border-ink shadow-brutal text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-red-600" />
          <h2 className="text-2xl font-display font-extrabold text-ink">System Offline Mode</h2>
          <p className="text-sm font-semibold text-subcopy max-w-md">
            The live verification feed or local server is currently unreachable. You are viewing cached offline data for the demo.
          </p>
          {this.state.error && (
            <div className="text-left bg-red-50 border border-red-200 rounded p-3 text-xs font-mono text-red-800 max-w-lg overflow-auto max-h-40">
              <strong>Error:</strong> {this.state.error.message || String(this.state.error)}
              {this.state.error.stack && (
                <pre className="mt-1 text-[10px] text-red-600 whitespace-pre-wrap">{this.state.error.stack}</pre>
              )}
            </div>
          )}
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="flex items-center gap-2 px-6 py-3 bg-accent text-surface font-display font-bold rounded-lg border-2 border-ink shadow-brutal-sm hover:-translate-y-0.5 transition cursor-pointer"
          >
            <RefreshCcw className="w-4 h-4" />
            Reconnect System
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
