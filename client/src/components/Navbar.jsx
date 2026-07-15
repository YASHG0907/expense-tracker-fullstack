// client/src/components/Navbar.jsx

import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Receipt, Users, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// NavLink (not Link) automatically knows if it's the "active" route
// and lets us style it differently — no manual URL comparison needed

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/groups", label: "Groups", icon: Users },
];

function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? "bg-[#FF6B4A]/10 text-[#FF6B4A]"
        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
      isActive ? "bg-[#FF6B4A]/10 text-[#FF6B4A]" : "text-gray-600"
    }`;

  return (
    <nav className="bg-white border-b border-[#F0EDE6] sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <span className="font-heading font-semibold text-lg text-gray-800">
              Expense<span className="text-[#FF6B4A]">Tracker</span>
            </span>

            {/* Desktop nav links — hidden below md breakpoint */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Desktop user info + logout — hidden below md breakpoint */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.name}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-4 py-2 rounded-lg"
            >
              Log out
            </button>
          </div>

          {/* Mobile hamburger — only visible below md breakpoint */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-600"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#F0EDE6] px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={mobileLinkClass}
              onClick={() => setMobileOpen(false)} // close menu after navigating
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
          <div className="pt-2 mt-2 border-t border-[#F0EDE6] flex items-center justify-between px-4">
            <span className="text-sm text-gray-500">{user?.name}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
