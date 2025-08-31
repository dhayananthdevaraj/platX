import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { BookOpen, Loader2 } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import FloatingInput from "../components/FloatingInput";
import Loader from "../components/Loader"; // fullscreen success loader

const Login: React.FC = () => {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false); // submitting
  const [successLoading, setSuccessLoading] = useState(false); // fullscreen loader

  useEffect(() => {
    const saved = localStorage.getItem("tp_login_email");
    if (saved) setFormData((p) => ({ ...p, email: saved }));
  }, []);

  if (loading) return <LoadingSpinner />;

  if (successLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  const validate = () => {
    const e: typeof errors = {};
    if (!formData.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      e.email = "Enter a valid email.";
    if (!formData.password) e.password = "Password is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (remember) localStorage.setItem("tp_login_email", formData.email);
      else localStorage.removeItem("tp_login_email");

      await login(formData.email, formData.password);

      setSuccessLoading(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name as "email" | "password"]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* --- Two-way split background (SOLID colors only) --- */}
      <div className="absolute inset-0 flex flex-col">
        <div className="h-1/2 bg-blue-600" />
        <div className="h-1/2 bg-white" />
      </div>

      {/* --- Decorative blobs (solid colors, no gradients) --- */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-10 left-10 h-40 w-40 rounded-full bg-white/25 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-52 w-52 rounded-full bg-blue-300/40 blur-3xl" />
      </div>

      {/* --- Centered Card --- */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-5xl rounded-3xl bg-white/90 backdrop-blur-xl shadow-[0_25px_80px_-15px_rgba(0,0,0,0.25)] overflow-hidden ring-1 ring-indigo-100">
          {/* Content rows (unchanged layout) */}
          <div className="flex flex-col md:flex-row">
            {/* Left: form */}
            <div className="w-full md:w-1/2 p-8 sm:p-10">
              <div className="mb-6 flex items-center gap-2">
                <BookOpen className="h-8 w-8 text-indigo-600" />
                <span className="text-xl font-bold text-gray-900">PAT360</span>
              </div>

              <h2 className="mb-1 text-3xl font-bold text-gray-900">Welcome back</h2>
              <p className="mb-6 text-sm text-gray-600">
                Sign in to continue to your dashboard.
              </p>

              {/* Form inputs */}
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-4">
                  <FloatingInput
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    label="Email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-rose-600">{errors.email}</p>
                  )}
                </div>

                <div className="mb-2">
                  <FloatingInput
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    label="Password"
                  />
                  {errors.password && (
                    <p className="mb-2 text-sm text-rose-600">{errors.password}</p>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between text-sm">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-gray-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    Remember me
                  </label>
                  <a
                    href="/forgot-password"
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white shadow-md transition
                    ${
                      isLoading
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                    }
                  `}
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Log in
                </button>
              </form>
            </div>

            {/* Right visual */}
            <div className="hidden md:flex w-full md:w-1/2 items-center justify-center p-10 bg-white">
              <div className="w-full text-center">
                <img
                  src="/images/login_img.png"
                  alt="Illustration"
                  className="mx-auto mb-6 w-[90%] max-w-md drop-shadow-xl"
                />
                <h3 className="mb-2 text-2xl font-semibold text-gray-900">
                  Focus. Attempt. Excel.
                </h3>
                <p className="mx-auto max-w-md text-sm text-gray-600">
                  Access exams, track performance, and stay on top of your goals—all in one.
                </p>
              </div>
            </div>
          </div>

          {/* --- Blue Footer at bottom of card (solid) --- */}
          <div className="w-full bg-blue-600 py-3 px-6 text-center" />
        </div>
      </div>
    </div>
  );
};

export default Login;
