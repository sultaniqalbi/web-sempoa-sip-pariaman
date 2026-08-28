import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangleIcon } from './SvgIcons';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const isChunkOrPreloadError = (err: Error | null): boolean => {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  return (
    msg.includes('preload css') ||
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('importing a module script failed') ||
    msg.includes('loading chunk') ||
    msg.includes('error loading dynamically imported module')
  );
};

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

    // Auto recover from stale build chunk / CSS preload error after new deployment
    if (isChunkOrPreloadError(error)) {
      const hasRetried = sessionStorage.getItem('chunk_reload_retry');
      if (!hasRetried) {
        sessionStorage.setItem('chunk_reload_retry', '1');
        window.location.reload();
        return;
      }
    }
  }

  public componentDidMount() {
    sessionStorage.removeItem('chunk_reload_retry');
  }

  public handleHardRefresh = () => {
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    sessionStorage.removeItem('chunk_reload_retry');
    window.location.href = window.location.pathname + '?reload=' + Date.now();
  };

  public render() {
    if (this.state.hasError) {
      const isChunk = isChunkOrPreloadError(this.state.error);
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full mx-auto flex items-center justify-center shadow-lg">
              <AlertTriangleIcon size={32} className="text-rose-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                {isChunk ? 'Pembaruan Sistem Tersedia' : 'Terjadi Masalah Sistem'}
              </h1>
              <p className="text-sm text-slate-400 mt-2">
                {isChunk
                  ? 'Aplikasi baru saja diperbarui ke versi terbaru. Silakan muat ulang untuk memuat sistem yang baru.'
                  : 'Halaman ini gagal dimuat karena kesalahan internal. Silakan muat ulang halaman.'}
              </p>
              {this.state.error && (
                <pre className="mt-4 p-3 bg-slate-950 text-rose-400 text-[10px] text-left font-mono rounded-lg overflow-x-auto max-h-40 border border-slate-900">
                  {this.state.error.message}
                </pre>
              )}
            </div>
            <button
              onClick={this.handleHardRefresh}
              className="w-full py-2.5 bg-amber-500 text-slate-900 font-bold rounded-xl hover:bg-amber-400 transition-colors shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <i className="fas fa-sync-alt"></i> Muat Ulang Versi Terbaru
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
