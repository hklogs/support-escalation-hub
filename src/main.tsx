import {StrictMode, Component, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class ErrorBoundary extends Component<{children: ReactNode}> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-md text-center space-y-4">
            <div className="text-rose-400 text-4xl">⚠</div>
            <h1 className="text-white text-xl font-bold">Something went wrong</h1>
            <pre className="text-slate-400 text-xs bg-slate-900 p-4 rounded-xl text-left overflow-auto max-h-60">{(this.state.error as Error).stack}</pre>
            <button onClick={() => location.reload()} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-semibold text-sm transition-all">
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
