// client/src/pages/Register.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    monthly_budget: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Runs on every keystroke in any input field
  // e.target.name matches the "name" attribute on each <input>
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear that specific field's error the moment the user starts fixing it
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  // Simple client-side checks BEFORE hitting the API
  // This gives instant feedback without waiting for a network round trip
  // The backend's Joi validation from Day 3 is still the real source of truth —
  // this is just a faster first line of defense for obvious mistakes
  const validate = () => {
    const newErrors = {};

    if (form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Enter a valid email address";
    }
    if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // stops the browser's default full-page-reload form submit

    if (!validate()) return;

    setLoading(true);

    try {
      const response = await api.post("/auth/register", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        monthly_budget: form.monthly_budget ? Number(form.monthly_budget) : 0,
      });

      const { token, user } = response.data;

      // Save to AuthContext + localStorage — this is what makes
      // the user "logged in" everywhere else in the app
      login(user, token);

      toast.success(`Welcome, ${user.name}!`);
      navigate("/dashboard");
    } catch (err) {
      // err.response.data.message comes from your AppError class in Day 3
      // e.g. "An account with this email already exists"
      const message =
        err.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFAF8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-semibold text-gray-800">
            Create your account
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Start tracking your expenses in under a minute
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#F0EDE6] rounded-2xl p-6 sm:p-8"
        >
          {/* NAME FIELD */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Rahul Desai"
              className={`w-full px-4 py-2.5 rounded-xl border text-gray-800 outline-none transition-colors
                ${errors.name ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-[#FF6B4A]"}`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* EMAIL FIELD */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={`w-full px-4 py-2.5 rounded-xl border text-gray-800 outline-none transition-colors
                ${errors.email ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-[#FF6B4A]"}`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* PASSWORD FIELD */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              className={`w-full px-4 py-2.5 rounded-xl border text-gray-800 outline-none transition-colors
                ${errors.password ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-[#FF6B4A]"}`}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* MONTHLY BUDGET FIELD — optional */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Monthly budget{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="number"
              name="monthly_budget"
              value={form.monthly_budget}
              onChange={handleChange}
              placeholder="15000"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#FF6B4A] text-gray-800 outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF6B4A] hover:bg-[#E85A3A] disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[#0D6E6E] font-medium hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
