// client/src/components/GroupExpenseForm.jsx

import { useState } from "react";

// Simpler than the personal ExpenseForm from Day 10 — no category,
// since group expenses are about splitting cost, not budgeting by category.
// Includes a "paid by" dropdown since any member could have paid.

function GroupExpenseForm({
  members,
  onSubmit,
  onCancel,
  loading,
  currentUserId,
}) {
  const [form, setForm] = useState({
    title: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    note: "",
    paid_by: currentUserId,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "Title is required";
    if (!form.amount || Number(form.amount) <= 0)
      newErrors.amount = "Enter an amount greater than 0";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      title: form.title.trim(),
      amount: Number(form.amount),
      expense_date: form.expense_date,
      note: form.note.trim(),
      paid_by: Number(form.paid_by),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Title
        </label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Hotel booking"
          className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-colors
            ${errors.title ? "border-red-300" : "border-gray-200 focus:border-[#FF6B4A]"}`}
        />
        {errors.title && (
          <p className="text-red-500 text-xs mt-1">{errors.title}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Amount (₹)
          </label>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            placeholder="0"
            className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-colors
              ${errors.amount ? "border-red-300" : "border-gray-200 focus:border-[#FF6B4A]"}`}
          />
          {errors.amount && (
            <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Paid by
          </label>
          <select
            name="paid_by"
            value={form.paid_by}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#FF6B4A] outline-none bg-white"
          >
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.user_id === currentUserId ? "You" : m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Date
        </label>
        <input
          type="date"
          name="expense_date"
          value={form.expense_date}
          onChange={handleChange}
          max={new Date().toISOString().split("T")[0]}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#FF6B4A] outline-none"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Note <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          name="note"
          value={form.note}
          onChange={handleChange}
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#FF6B4A] outline-none resize-none"
        />
      </div>

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
          {loading ? "Adding..." : "Add expense"}
        </button>
      </div>
    </form>
  );
}

export default GroupExpenseForm;
