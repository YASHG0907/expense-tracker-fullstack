// client/src/pages/Expenses.jsx

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Download } from "lucide-react";
import api from "../api/axios";
import Modal from "../components/Modal";
import ExpenseForm from "../components/ExpenseForm";
import ConfirmDialog from "../components/ConfirmDialog";

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

const CATEGORY_COLORS = {
  Food: "#FF6B4A",
  Transport: "#0D6E6E",
  Shopping: "#A855F7",
  Health: "#22C55E",
  Entertainment: "#EAB308",
  Housing: "#3B82F6",
  Utilities: "#F97316",
  Education: "#EC4899",
  Travel: "#14B8A6",
  Other: "#6B7280",
};

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null); // null = adding new
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ─── FETCH EXPENSES ─────────────────────────────────────
  // useCallback prevents this function from being recreated on every
  // render, which matters because it's a dependency of the useEffect below
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (monthFilter) {
        const [year, month] = monthFilter.split("-");
        params.month = Number(month);
        params.year = Number(year);
      }

      const response = await api.get("/expenses", { params });
      setExpenses(response.data.data);
    } catch (err) {
      toast.error("Could not load expenses");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, monthFilter]);

  // Runs on mount, and again whenever filters change
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // ─── ADD / EDIT SUBMIT ──────────────────────────────────
  const handleFormSubmit = async (data) => {
    setFormLoading(true);
    try {
      if (editingExpense) {
        // EDIT — PUT to /expenses/:id
        await api.put(`/expenses/${editingExpense.id}`, data);
        toast.success("Expense updated");
      } else {
        // ADD — POST to /expenses
        const response = await api.post("/expenses", data);
        toast.success("Expense added");

        // If the backend flagged a budget overage, show a second toast
        if (response.data.budgetWarning?.exceeded) {
          toast.error(
            `You've gone ₹${response.data.budgetWarning.overage} over budget this month`,
            { duration: 5000 },
          );
        }
      }

      setIsFormOpen(false);
      setEditingExpense(null);
      fetchExpenses(); // refresh the list to show the change
    } catch (err) {
      const message = err.response?.data?.message || "Something went wrong";
      toast.error(message);
    } finally {
      setFormLoading(false);
    }
  };

  // Add this function inside the Expenses component

  const handleExportCSV = async () => {
    try {
      const response = await api.get("/expenses/export", {
        responseType: "blob", // tells axios to expect raw file data, not JSON
      });

      // Create a temporary downloadable URL from the response data
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // Create an invisible link, click it programmatically, then remove it —
      // this is the standard browser trick for triggering a file download
      // from JavaScript rather than a plain <a href> link
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `expenses-${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Free up the memory used by the temporary URL
      window.URL.revokeObjectURL(url);

      toast.success("Expenses exported");
    } catch (err) {
      toast.error("Could not export expenses");
    }
  };

  // ─── DELETE ─────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/expenses/${deleteTarget.id}`);
      toast.success("Expense deleted");
      setDeleteTarget(null);
      fetchExpenses();
    } catch (err) {
      const message = err.response?.data?.message || "Could not delete expense";
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingExpense(null);
    setIsFormOpen(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const totalShown = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return (
    <div className="min-h-screen bg-[#FBFAF8] p-4 sm:p-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-gray-800">
            Expenses
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {expenses.length} transaction{expenses.length !== 1 ? "s" : ""} · ₹
            {totalShown.toLocaleString("en-IN")} total
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            <Download size={18} />
            Export
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-[#FF6B4A] hover:bg-[#E85A3A] text-white font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={18} />
            Add expense
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:border-[#FF6B4A]"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:border-[#FF6B4A]"
        />

        {(categoryFilter || monthFilter) && (
          <button
            onClick={() => {
              setCategoryFilter("");
              setMonthFilter("");
            }}
            className="text-sm text-gray-500 hover:text-gray-700 px-3"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* EXPENSE LIST */}
      {loading ? (
        <ExpenseListSkeleton />
      ) : expenses.length === 0 ? (
        <EmptyState onAdd={openAddModal} />
      ) : (
        <div className="bg-white border border-[#F0EDE6] rounded-2xl overflow-hidden">
          {/* Desktop table — hidden on small screens */}
          <table className="w-full hidden sm:table">
            <thead>
              <tr className="border-b border-[#F0EDE6] text-left">
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                  Title
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase text-right">
                  Amount
                </th>
                <th className="px-5 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <ExpenseRow
                  key={exp.id}
                  expense={exp}
                  onEdit={() => openEditModal(exp)}
                  onDelete={() => setDeleteTarget(exp)}
                />
              ))}
            </tbody>
          </table>

          {/* Mobile card list — hidden on larger screens */}
          <div className="sm:hidden divide-y divide-[#F0EDE6]">
            {expenses.map((exp) => (
              <ExpenseCard
                key={exp.id}
                expense={exp}
                onEdit={() => openEditModal(exp)}
                onDelete={() => setDeleteTarget(exp)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingExpense(null);
        }}
        title={editingExpense ? "Edit expense" : "Add expense"}
      >
        <ExpenseForm
          initialData={editingExpense}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingExpense(null);
          }}
          loading={formLoading}
        />
      </Modal>

      {/* DELETE CONFIRM */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete expense?"
        message={`This will permanently delete "${deleteTarget?.title}". This can't be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────

function ExpenseRow({ expense, onEdit, onDelete }) {
  const color = CATEGORY_COLORS[expense.category] || "#6B7280";

  return (
    <tr className="border-b border-[#F0EDE6] last:border-0 hover:bg-[#FBFAF8] group">
      <td className="px-5 py-3.5 text-sm text-gray-800">{expense.title}</td>
      <td className="px-5 py-3.5">
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {expense.category}
        </span>
      </td>
      <td className="px-5 py-3.5 text-sm text-gray-500">
        {new Date(expense.expense_date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </td>
      <td className="px-5 py-3.5 text-sm font-medium text-gray-800 text-right">
        ₹{parseFloat(expense.amount).toLocaleString("en-IN")}
      </td>
      <td className="px-5 py-3.5">
        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-[#0D6E6E] hover:bg-gray-100 rounded-lg"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-lg"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function ExpenseCard({ expense, onEdit, onDelete }) {
  const color = CATEGORY_COLORS[expense.category] || "#6B7280";

  return (
    <div className="p-4 flex justify-between items-start">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">
          {expense.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${color}18`, color }}
          >
            {expense.category}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(expense.expense_date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
      </div>
      <div className="text-right ml-3 flex-shrink-0">
        <p className="text-sm font-semibold text-gray-800">
          ₹{parseFloat(expense.amount).toLocaleString("en-IN")}
        </p>
        <div className="flex gap-1 mt-1.5 justify-end">
          <button onClick={onEdit} className="p-1 text-gray-400">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} className="p-1 text-gray-400">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="bg-white border border-[#F0EDE6] rounded-2xl py-16 text-center">
      <p className="text-gray-500 text-sm mb-4">No expenses yet</p>
      <button
        onClick={onAdd}
        className="text-[#FF6B4A] font-medium text-sm hover:underline"
      >
        Add your first expense
      </button>
    </div>
  );
}

function ExpenseListSkeleton() {
  return (
    <div className="bg-white border border-[#F0EDE6] rounded-2xl p-5 space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

export default Expenses;
