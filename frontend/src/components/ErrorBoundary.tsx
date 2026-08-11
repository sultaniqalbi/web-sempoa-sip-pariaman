import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full mx-auto flex items-center justify-center text-3xl font-extrabold shadow-lg">
              ⚠️
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Terjadi Masalah Sistem</h1>
              <p className="text-sm text-slate-400 mt-2">
                Halaman ini gagal dimuat karena kesalahan internal. Silakan muat ulang halaman.
              </p>
              {this.state.error && (
                <pre className="mt-4 p-3 bg-slate-950 text-rose-400 text-[10px] text-left font-mono rounded-lg overflow-x-auto max-h-40 border border-slate-900">
                  {this.state.error.message}
                </pre>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-amber-500 text-slate-900 font-bold rounded-xl hover:bg-amber-400 transition-colors shadow-md"
            >
              🔄 Refresh Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
