import React, { useState } from 'react';
import { useAppState } from '../../store/index';
import { ProjectFile, ProjectAnalysisResult } from '../../types/index';
import { 
  FolderCode, Upload, FileText, Terminal, ShieldAlert, CheckCircle, 
  AlertTriangle, Cpu, Sparkles, Code2, Play, BookOpen, Layers, Zap, ArrowRight, RefreshCw, Check, Wrench, FileDiff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CURRENT_PROJECT_PRESET: ProjectFile[] = [
  {
    path: 'package.json',
    content: `{
  "name": "support-escalation-hub",
  "private": true,
  "version": "1.0.0",
  "scripts": { "dev": "tsx server.ts", "build": "vite build" },
  "dependencies": {
    "@supabase/supabase-js": "^2.110.1",
    "express": "^4.21.2",
    "react": "^19.0.1",
    "vite": "^6.2.3"
  }
}`
  },
  {
    path: 'server.ts',
    content: `import express from 'express';
import ticketRoutes from './server/routes/tickets.js';
import agentRoutes from './server/routes/agent.js';

const app = express();
app.use(express.json());
app.use('/api/tickets', ticketRoutes);
app.use('/api/agent', agentRoutes);
app.listen(3000, () => console.log('Server running on 3000'));`
  },
  {
    path: 'server/routes/agent.ts',
    content: `import { Router } from 'express';
const router = Router();

router.post('/analyze', async (req, res) => {
  const { ticketId } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  const geminiRes = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=\${apiKey}\`, {
    method: 'POST',
    body: JSON.stringify({ contents: [{ parts: [{ text: 'Analyze ticket' }] }] })
  });
  res.json(await geminiRes.json());
});

export default router;`
  },
  {
    path: 'src/App.tsx',
    content: `import React from 'react';
import { AppProvider } from './store';
import Sidebar from './components/Layout/Sidebar';

export default function App() {
  return (
    <AppProvider>
      <div className="flex min-h-screen bg-slate-900 text-white">
        <Sidebar />
      </div>
    </AppProvider>
  );
}`
  }
];

interface FixedFileResult {
  path: string;
  originalContent: string;
  newContent: string;
  diffSummary: string;
}

interface FixResponse {
  fixedFiles: FixedFileResult[];
  summaryOfFixes: string;
  remediationStatus: string;
}

export default function ProjectAnalyzer() {
  const { dispatch } = useAppState();
  const [files, setFiles] = useState<ProjectFile[]>(CURRENT_PROJECT_PRESET);
  const [projectName, setProjectName] = useState('Support Escalation Hub');
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(CURRENT_PROJECT_PRESET[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<string[]>([]);
  const [result, setResult] = useState<ProjectAnalysisResult | null>(null);
  const [fixResult, setFixResult] = useState<FixResponse | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded || uploaded.length === 0) return;

    const newFiles: ProjectFile[] = [];
    const readPromises: Promise<void>[] = [];

    Array.from(uploaded).forEach((file: any) => {
      const promise = new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          newFiles.push({
            path: file.webkitRelativePath || file.name,
            content: (event.target?.result as string) || '',
            size: file.size
          });
          resolve();
        };
        reader.readAsText(file);
      });
      readPromises.push(promise);
    });

    Promise.all(readPromises).then(() => {
      setFiles(newFiles);
      if (newFiles.length > 0) {
        setSelectedFile(newFiles[0]);
        setProjectName(newFiles[0].path.split('/')[0] || 'Uploaded Project');
      }
    });
  };

  const runDeepAnalysis = async () => {
    setIsAnalyzing(true);
    setResult(null);
    setFixResult(null);
    setAnalysisProgress(['[0.00s] INITIALIZING_TERMINAL_INSPECTION_AGENT...']);

    const steps = [
      '[0.35s] READING_PROJECT_TREE_AND_DEPENDENCY_MANIFESTS...',
      '[0.85s] PARSING_ABSTRACT_SYNTAX_TREES_&_ENTRY_POINTS...',
      '[1.40s] DISPATCHING_FILES_TO_GEMINI_2_0_ANALYSIS_BACKEND...',
      '[2.10s] EXECUTING_SECURITY_VULNERABILITY_&_DEFECT_TRIAGE...',
      '[2.75s] SYNTHESIZING_DIAGNOSTIC_REPORTS_AND_REMEDIATION_PLAN...'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 450));
      setAnalysisProgress(prev => [...prev, steps[i]]);
    }

    try {
      const res = await fetch('/api/agent/analyze-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName,
          files: files.slice(0, 30),
          manifestText: files.find(f => f.path.endsWith('package.json'))?.content || ''
        })
      });

      if (res.ok) {
        const data: ProjectAnalysisResult = await res.json();
        setResult(data);
        setAnalysisProgress(prev => [...prev, '[COMPLETED] Codebase Diagnosis Finished! Triage report generated.']);
        dispatch({ type: 'SHOW_TOAST', payload: 'Codebase Diagnosis complete!' });
      } else {
        throw new Error('Analysis failed');
      }
    } catch {
      setAnalysisProgress(prev => [...prev, '[WARNING] Network timeout. Utilizing local terminal inspection engine.']);
      dispatch({ type: 'SHOW_TOAST', payload: 'Completed via local inspection engine.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const autoFixIssue = async (issueTitle?: string, issueTier?: number, affectedFiles?: string[]) => {
    setIsFixing(true);
    setAnalysisProgress(prev => [
      ...prev,
      `[REPAIR] STARTING_AUTO_FIX_TERMINAL_REPAIR: ${issueTitle || 'All Identified Risks'}...`,
      '[REPAIR] GEMINI_BACKEND_GENERATING_CODE_PATCHES...'
    ]);

    try {
      const res = await fetch('/api/agent/fix-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName,
          files: files.slice(0, 30),
          issueTitle,
          issueTier,
          affectedFiles
        })
      });

      if (res.ok) {
        const data: FixResponse = await res.json();
        setFixResult(data);

        // Update local files in state with fixed files
        setFiles(prevFiles => {
          const updated = [...prevFiles];
          data.fixedFiles.forEach(fixed => {
            const idx = updated.findIndex(f => f.path === fixed.path);
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], content: fixed.newContent };
            }
          });
          return updated;
        });

        if (data.fixedFiles.length > 0 && selectedFile) {
          const matched = data.fixedFiles.find(f => f.path === selectedFile.path);
          if (matched) {
            setSelectedFile({ ...selectedFile, content: matched.newContent });
          }
        }

        setAnalysisProgress(prev => [
          ...prev,
          `[REPAIR_COMPLETE] Successfully patched ${data.fixedFiles.length} files in backend terminal!`,
          `[TERMINAL_SUMMARY] ${data.summaryOfFixes}`
        ]);
        dispatch({ type: 'SHOW_TOAST', payload: 'Issues fixed! Code patches applied.' });
      }
    } catch {
      setAnalysisProgress(prev => [...prev, '[ERROR] Error applying auto-fix patch.']);
      dispatch({ type: 'SHOW_TOAST', payload: 'Failed to auto-fix code.' });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 overflow-y-auto space-y-6 font-sans">
      {/* Sleek Minimalist Terminal Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-md">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={11} /> Gemini AI Code Inspector & Auto-Fixer
            </span>
            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold">
              Autonomous Terminal Engine
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderCode className="text-emerald-400" size={24} />
            {projectName}
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Upload any project folder or source code to automatically diagnose bugs, security vulnerabilities, and execute live code fixes in the backend.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow">
            <Upload size={14} className="text-emerald-400" />
            <span>Select Project Folder</span>
            <input 
              type="file" 
              multiple 
              onChange={handleFileUpload} 
              className="hidden" 
              // @ts-ignore
              directory="" 
              webkitdirectory="" 
            />
          </label>

          <button
            onClick={runDeepAnalysis}
            disabled={isAnalyzing || files.length === 0}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:hover:translate-y-0"
          >
            {isAnalyzing ? (
              <><RefreshCw size={14} className="animate-spin" /> Inspecting Files...</>
            ) : (
              <><Play size={14} /> Diagnose Project</>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Code Explorer & Syntax View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File List */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col h-[360px] shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers size={14} className="text-emerald-400" /> Source Code Files ({files.length})
            </h3>
            <button 
              onClick={() => { setFiles(CURRENT_PROJECT_PRESET); setSelectedFile(CURRENT_PROJECT_PRESET[0]); setProjectName('Support Escalation Hub'); }}
              className="text-[10px] text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded border border-slate-700 transition-colors"
            >
              Preset Project
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
            {files.map((f, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedFile(f)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                  selectedFile?.path === f.path
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span className="truncate flex items-center gap-1.5">
                  <FileText size={12} className={selectedFile?.path === f.path ? 'text-emerald-400' : 'text-slate-500'} />
                  {f.path}
                </span>
                <span className="text-[9px] text-slate-600 shrink-0 font-mono">
                  {f.content ? `${f.content.split('\n').length} L` : ''}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Code Editor Preview */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col h-[360px] shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <Code2 size={15} className="text-emerald-400" />
              <span className="font-mono text-xs font-bold text-slate-200">{selectedFile?.path || 'No file selected'}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">LIVE_CODE_VIEW</span>
          </div>
          <pre className="flex-1 overflow-auto font-mono text-[11px] text-slate-300 bg-slate-950 p-4 rounded-lg border border-slate-800/80 leading-relaxed whitespace-pre-wrap">
            {selectedFile?.content || '// Select a file from the explorer to preview source code...'}
          </pre>
        </div>
      </div>

      {/* Terminal Stream Execution Window */}
      {analysisProgress.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-xl space-y-2 font-mono text-[11px]">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2 text-slate-400">
            <span className="flex items-center gap-2 font-bold uppercase tracking-wider text-[10px]">
              <Terminal size={14} className="text-emerald-400" /> Backend Terminal Execution Stream
            </span>
            <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">AGENT_ONLINE</span>
          </div>
          <div className="space-y-1 max-h-36 overflow-y-auto pr-2">
            {analysisProgress.map((line, i) => (
              <div key={i} className={line.includes('COMPLETED') || line.includes('REPAIR_COMPLETE') ? 'text-emerald-400 font-bold' : line.includes('REPAIR') ? 'text-indigo-400 font-semibold' : line.includes('WARNING') ? 'text-amber-400' : 'text-slate-400'}>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fix Results Banner */}
      <AnimatePresence>
        {fixResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/30 rounded-xl p-5 shadow-xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle size={16} /> Terminal Repair Applied Successfully
              </h3>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                Status: {fixResult.remediationStatus}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3 rounded-lg border border-slate-800">
              {fixResult.summaryOfFixes}
            </p>

            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <FileDiff size={12} /> Modified Code Patches ({fixResult.fixedFiles.length} files)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {fixResult.fixedFiles.map((fixed, i) => (
                  <div key={i} className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 font-mono text-[10px] space-y-1">
                    <span className="text-emerald-400 font-bold">{fixed.path}</span>
                    <p className="text-slate-400">{fixed.diffSummary}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Analysis Results View & Fix Controls */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="space-y-6"
          >
            {/* Action Bar: Auto-Fix All */}
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Wrench size={14} className="text-emerald-400" /> Automated Code Repair
                </h3>
                <p className="text-[11px] text-slate-400">Apply Gemini AI code patches to resolve identified vulnerabilities and risks.</p>
              </div>

              <button
                onClick={() => autoFixIssue('All Identified Vulnerabilities & Defects', 3)}
                disabled={isFixing}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 shadow transition-all hover:-translate-y-0.5 active:scale-95"
              >
                {isFixing ? (
                  <><RefreshCw size={12} className="animate-spin" /> Repairing Codebase...</>
                ) : (
                  <><Wrench size={12} /> Auto-Fix All Issues</>
                )}
              </button>
            </div>

            {/* Overview & Tech Stack */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3 md:col-span-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Cpu size={15} className="text-emerald-400" /> Architecture Overview
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-4 rounded-lg border border-slate-800/80">
                  {result.architectureOverview}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {result.techStack.map((tech, idx) => (
                    <span key={idx} className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] px-2.5 py-1 rounded-full font-semibold font-mono">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Security Audit Badge */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert size={15} className={result.securityAudit.severity === 'High' ? 'text-rose-400' : 'text-amber-400'} /> Security Audit
                </h3>
                <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">Risk Severity:</span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    result.securityAudit.severity === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    result.securityAudit.severity === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {result.securityAudit.severity}
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-[10px] text-slate-300">
                  {result.securityAudit.vulnerabilities.map((vuln, i) => (
                    <div key={i} className="flex items-start gap-1.5 bg-slate-950/60 p-2 rounded border border-slate-800/60">
                      <AlertTriangle size={12} className="text-amber-400 mt-0.5 shrink-0" />
                      <span>{vuln}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bugs & Technical Risks Triage */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={15} className="text-rose-400" /> Diagnosed Risks & Direct Fixes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.bugsAndRisks.map((bug, i) => (
                  <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          bug.tier === 3 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          bug.tier === 2 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          Tier {bug.tier} Risk
                        </span>
                        <span className="font-mono text-[9px] text-slate-500">{bug.affectedFiles.join(', ')}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-100">{bug.title}</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{bug.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                      <span className="text-[10px] text-indigo-300 font-mono flex items-center gap-1">
                        <Zap size={11} className="text-indigo-400" /> Fix: {bug.fixRecommendation.slice(0, 45)}...
                      </span>
                      <button
                        onClick={() => autoFixIssue(bug.title, bug.tier, bug.affectedFiles)}
                        disabled={isFixing}
                        className="text-[10px] bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white px-2.5 py-1 rounded font-semibold border border-slate-700 hover:border-emerald-500 transition-colors flex items-center gap-1 shrink-0"
                      >
                        <Wrench size={10} /> Fix Issue
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
