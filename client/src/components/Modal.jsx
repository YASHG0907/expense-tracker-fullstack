// client/src/components/Modal.jsx

import { useEffect } from "react";
import { X } from "lucide-react";

// Generic modal shell — handles the overlay, closing on Escape key,
// and closing when clicking outside the modal box.
// The actual form content is passed in as children.

function Modal({ isOpen, onClose, title, children }) {
  // Close on Escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent the page behind the modal from scrolling while it's open
      document.body.style.overflow = "hidden";
    }

    // Cleanup — runs when the modal closes or component unmounts
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null; // render nothing at all when closed

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={onClose} // clicking the dark overlay closes the modal
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // prevents clicks INSIDE the modal from closing it
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-heading text-xl font-semibold text-gray-800">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Modal;
