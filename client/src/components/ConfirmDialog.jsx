// client/src/components/ConfirmDialog.jsx

import Modal from "./Modal";

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  loading,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-gray-600 text-sm mb-6">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-medium"
        >
          {loading ? "Deleting..." : "Delete"}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
