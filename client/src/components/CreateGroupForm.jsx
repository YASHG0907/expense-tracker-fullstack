// client/src/components/CreateGroupForm.jsx

import { useState } from "react";
import { X } from "lucide-react";

// Handles the multi-email invite input — each email becomes a "chip"
// that can be removed individually before submitting

function CreateGroupForm({ onSubmit, onCancel, loading }) {
  const [name, setName] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [memberEmails, setMemberEmails] = useState([]);
  const [errors, setErrors] = useState({});

  // Pressing Enter or comma while typing an email adds it as a chip
  const handleEmailKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEmail();
    }
  };

  const addEmail = () => {
    const trimmed = emailInput.trim();
    if (!trimmed) return;

    const isValidFormat = /^\S+@\S+\.\S+$/.test(trimmed);
    if (!isValidFormat) {
      setErrors({ ...errors, email: "Enter a valid email address" });
      return;
    }

    if (memberEmails.includes(trimmed)) {
      setErrors({ ...errors, email: "Already added" });
      return;
    }

    setMemberEmails([...memberEmails, trimmed]);
    setEmailInput("");
    setErrors({ ...errors, email: null });
  };

  const removeEmail = (email) => {
    setMemberEmails(memberEmails.filter((e) => e !== email));
  };

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Group name is required";
    if (memberEmails.length === 0) newErrors.email = "Add at least one member";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      monthly_limit: monthlyLimit ? Number(monthlyLimit) : null,
      memberEmails,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Group name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Goa Trip"
          className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-colors
            ${errors.name ? "border-red-300" : "border-gray-200 focus:border-[#FF6B4A]"}`}
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Monthly limit{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="number"
          value={monthlyLimit}
          onChange={(e) => setMonthlyLimit(e.target.value)}
          placeholder="5000"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#FF6B4A] outline-none"
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Invite members
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={handleEmailKeyDown}
            placeholder="friend@example.com"
            className={`flex-1 px-4 py-2.5 rounded-xl border outline-none transition-colors
              ${errors.email ? "border-red-300" : "border-gray-200 focus:border-[#FF6B4A]"}`}
          />
          <button
            type="button"
            onClick={addEmail}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Add
          </button>
        </div>
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          Press Enter to add each email. They must already have an account.
        </p>
      </div>

      {memberEmails.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 mt-3">
          {memberEmails.map((email) => (
            <span
              key={email}
              className="flex items-center gap-1.5 bg-[#FBFAF8] border border-[#F0EDE6] text-gray-700 text-xs px-3 py-1.5 rounded-full"
            >
              {email}
              <button
                type="button"
                onClick={() => removeEmail(email)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-[#FF6B4A] hover:bg-[#E85A3A] disabled:opacity-60 text-white font-medium"
        >
          {loading ? "Creating..." : "Create group"}
        </button>
      </div>
    </form>
  );
}

export default CreateGroupForm;
