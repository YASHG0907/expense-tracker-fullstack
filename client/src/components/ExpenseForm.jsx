// client/src/components/ExpenseForm.jsx

import { useState, useEffect } from "react";

const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Health",
  "Entertainment",
  "Housing",
  "Utilities",
  "Education",
  "Travel",
  "Other",
];

// This form handles BOTH add and edit.
// If `initialData` is passed, it's pre-filled for editing.
// If not, it starts blank for a new expense.

function ExpenseForm({ initialData, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food",
    expense_date: new Date().toISOString().split("T")[0], // today's date, YYYY-MM-DD
    note: "",
  });

  const [errors, setErrors] = useState({});

  // When initialData changes (i.e. we opened the modal to EDIT something),
  // populate the form with that expense's existing values
  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title,
        amount: initialData.amount,
        category: initialData.category,
        // expense_date from the API comes as a full ISO string like
        // "2026-06-20T00:00:00.000Z" — the date input needs just "2026-06-20"
        expense_date: initialData.expense_date.split("T")[0],
        note: initialData.note || "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "Title is required";
    if (!form.amount || Number(form.amount) <= 0)
      newErrors.amount = "Enter an amount greater than 0";
    if (!form.expense_date) newErrors.expense_date = "Date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      title: form.title.trim(),
      amount: Number(form.amount),
      category: form.category,
      expense_date: form.expense_date,
      note: form.note.trim(),
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
          placeholder="Grocery shopping"
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
            Category
          </label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#FF6B4A] outline-none bg-white"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
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
          max={new Date().toISOString().split("T")[0]} // can't pick a future date
          className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-colors
            ${errors.expense_date ? "border-red-300" : "border-gray-200 focus:border-[#FF6B4A]"}`}
        />
        {errors.expense_date && (
          <p className="text-red-500 text-xs mt-1">{errors.expense_date}</p>
        )}
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
          placeholder="Any extra details"
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
          {loading ? "Saving..." : initialData ? "Save changes" : "Add expense"}
        </button>
      </div>
    </form>
  );
}

export default ExpenseForm;
