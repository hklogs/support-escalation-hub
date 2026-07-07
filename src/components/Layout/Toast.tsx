import { motion, AnimatePresence } from 'motion/react';
import { useAppState } from '../../store/index';

export default function Toast() {
  const { state } = useAppState();

  return (
    <AnimatePresence>
      {state.toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-5 right-5 bg-slate-900 text-white text-xs py-3 px-5 rounded-lg border border-slate-800 shadow-xl flex items-center space-x-2 z-50"
        >
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping shrink-0" />
          <span className="font-medium">{state.toastMessage}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
