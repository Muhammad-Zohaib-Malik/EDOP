import { motion, AnimatePresence } from "framer-motion";

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, isDestructive = true }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100"
        >
          <div className="p-6">
            <h3 className="font-display font-semibold text-xl text-slate-900 mb-2">
              {title}
            </h3>
            <p className="font-sans text-sm text-slate-500 leading-relaxed mb-8">
              {message}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 font-sans text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 font-sans text-sm font-medium text-white rounded-md transition-colors shadow-lg ${
                  isDestructive 
                    ? "bg-[#ef4444] hover:bg-red-600 shadow-red-500/20" 
                    : "bg-[#3b82f6] hover:bg-blue-600 shadow-blue-500/20"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmModal;
