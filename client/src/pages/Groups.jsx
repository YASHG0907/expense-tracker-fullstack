// client/src/pages/Groups.jsx

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, Users, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import Modal from "../components/Modal";
import CreateGroupForm from "../components/CreateGroupForm";
import GroupExpenseForm from "../components/GroupExpenseForm";
import SettlementSummary from "../components/SettlementSummary";

function Groups() {
  const { user } = useAuth();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupDetail, setGroupDetail] = useState(null);
  const [balances, setBalances] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // ─── FETCH GROUP LIST ───────────────────────────────────
  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/groups");
      setGroups(response.data.data);
    } catch (err) {
      toast.error("Could not load groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // ─── FETCH ONE GROUP'S DETAIL + BALANCES ────────────────
  const fetchGroupDetail = useCallback(async (groupId) => {
    setDetailLoading(true);
    try {
      const [detailRes, balancesRes] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/groups/${groupId}/balances`),
      ]);
      setGroupDetail(detailRes.data.data);
      setBalances(balancesRes.data.data);
    } catch (err) {
      toast.error("Could not load group details");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openGroup = (groupId) => {
    setSelectedGroupId(groupId);
    fetchGroupDetail(groupId);
  };

  const goBackToList = () => {
    setSelectedGroupId(null);
    setGroupDetail(null);
    setBalances(null);
    fetchGroups(); // refresh in case member counts changed
  };

  // ─── CREATE GROUP ───────────────────────────────────────
  const handleCreateGroup = async (data) => {
    setFormLoading(true);
    try {
      await api.post("/groups", data);
      toast.success("Group created");
      setIsCreateOpen(false);
      fetchGroups();
    } catch (err) {
      const message = err.response?.data?.message || "Could not create group";
      toast.error(message);
    } finally {
      setFormLoading(false);
    }
  };

  // ─── ADD GROUP EXPENSE ──────────────────────────────────
  const handleAddExpense = async (data) => {
    setFormLoading(true);
    try {
      await api.post(`/groups/${selectedGroupId}/expenses`, data);
      toast.success("Expense added");
      setIsExpenseOpen(false);
      fetchGroupDetail(selectedGroupId); // refresh detail + balances
    } catch (err) {
      const message = err.response?.data?.message || "Could not add expense";
      toast.error(message);
    } finally {
      setFormLoading(false);
    }
  };

  // ─── LIST VIEW ──────────────────────────────────────────
  if (!selectedGroupId) {
    return (
      <div className="min-h-screen bg-[#FBFAF8] p-4 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-gray-800">
              Groups
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Split expenses with friends and family
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-[#FF6B4A] hover:bg-[#E85A3A] text-white font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={18} />
            New group
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white border border-[#F0EDE6] rounded-2xl p-5 h-28 animate-pulse"
              />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white border border-[#F0EDE6] rounded-2xl py-16 text-center">
            <Users size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm mb-4">No groups yet</p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="text-[#FF6B4A] font-medium text-sm hover:underline"
            >
              Create your first group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => openGroup(group.id)}
                className="text-left bg-white border border-[#F0EDE6] rounded-2xl p-5 hover:border-[#FF6B4A] transition-colors"
              >
                <h3 className="font-heading font-semibold text-gray-800 mb-1">
                  {group.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {group.member_count} member
                  {group.member_count !== 1 ? "s" : ""}
                  {group.monthly_limit &&
                    ` · ₹${Number(group.monthly_limit).toLocaleString("en-IN")} limit`}
                </p>
              </button>
            ))}
          </div>
        )}

        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Create a group"
        >
          <CreateGroupForm
            onSubmit={handleCreateGroup}
            onCancel={() => setIsCreateOpen(false)}
            loading={formLoading}
          />
        </Modal>
      </div>
    );
  }

  // ─── DETAIL VIEW ────────────────────────────────────────
  if (detailLoading || !groupDetail) {
    return (
      <div className="min-h-screen bg-[#FBFAF8] p-4 sm:p-8">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-6" />
        <div className="bg-white border border-[#F0EDE6] rounded-2xl p-5 h-64 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFAF8] p-4 sm:p-8">
      <button
        onClick={goBackToList}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={16} />
        Back to groups
      </button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-gray-800">
            {groupDetail.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {groupDetail.members.length} member
            {groupDetail.members.length !== 1 ? "s" : ""} · ₹
            {balances?.totalSpent.toLocaleString("en-IN") || 0} total spent
          </p>
        </div>
        <button
          onClick={() => setIsExpenseOpen(true)}
          className="flex items-center gap-2 bg-[#FF6B4A] hover:bg-[#E85A3A] text-white font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={18} />
          Add expense
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* SETTLEMENTS */}
        <div className="bg-white border border-[#F0EDE6] rounded-2xl p-5">
          <h2 className="font-heading text-base font-semibold text-gray-800 mb-4">
            Settle up
          </h2>
          <SettlementSummary
            settlements={balances?.settlements}
            currentUserId={user.id}
          />
        </div>

        {/* EXPENSE LIST */}
        <div className="bg-white border border-[#F0EDE6] rounded-2xl p-5">
          <h2 className="font-heading text-base font-semibold text-gray-800 mb-4">
            Expenses
          </h2>
          {groupDetail.expenses.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No expenses yet
            </p>
          ) : (
            <div className="space-y-3">
              {groupDetail.expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex justify-between items-center pb-3 border-b border-[#F0EDE6] last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {exp.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Paid by{" "}
                      {exp.paid_by === user.id ? "you" : exp.paid_by_name} ·{" "}
                      {new Date(exp.expense_date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">
                    ₹{parseFloat(exp.amount).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        title="Add group expense"
      >
        <GroupExpenseForm
          members={groupDetail.members}
          currentUserId={user.id}
          onSubmit={handleAddExpense}
          onCancel={() => setIsExpenseOpen(false)}
          loading={formLoading}
        />
      </Modal>
    </div>
  );
}

export default Groups;
