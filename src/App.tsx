import React from 'react';
import { AppProvider } from './store/index';
import Header from './components/Layout/Header';
import Toast from './components/Layout/Toast';
import ProjectAnalyzer from './components/Project/ProjectAnalyzer';

function AppContent() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Header />
      <main className="flex-1 flex overflow-hidden">
        <ProjectAnalyzer />
      </main>
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
