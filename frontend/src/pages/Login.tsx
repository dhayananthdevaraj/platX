import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import FloatingInput from "../components/FloatingInput";

const Login: React.FC = () => {
  const { user, login, loading } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="relative min-h-screen w-full">
      {/* Background split into 2 halves (top & bottom) */}
      <div className="absolute inset-0 flex flex-col">
        <div className="h-1/2 bg-blue-600"></div>
        <div className="h-1/2 bg-[#f3f6ff]"></div>
      </div>

      {/* Card Positioned in Middle */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="flex flex-col md:flex-row w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Left Side - Login Form */}
          <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Login</h2>

            <form onSubmit={handleSubmit}>
              <FloatingInput
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                label="Email"
              />

              <div className="relative">
                <FloatingInput
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  label="Password"
                />
                <button
                  type="button"
                  className="absolute right-2 top-3 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between mt-2 text-sm">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <a href="/forgot-password" className="text-blue-600 hover:underline">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`mt-6 w-full py-2.5 rounded-lg font-semibold shadow-md transition duration-200 
                  ${isLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
              >
                Login
              </button>
            </form>

            <p className="mt-6 text-sm text-gray-500 text-center">
              Don’t have an account?{" "}
              <a href="/register" className="text-blue-600 hover:underline font-medium">
                Sign up
              </a>
            </p>
          </div>

          {/* Right Side - Illustration & Info (hidden on mobile) */}
          <div className="hidden md:flex w-full md:w-1/2 items-center justify-center p-10 bg-[#f9fafe]">
            <div className="text-center w-full">
              <img
                src="/images/login_img.png"
                alt="Login Illustration"
                className="mb-6 w-[90%] max-w-lg mx-auto"
              />
              <h3 className="text-2xl font-semibold mb-3 text-gray-800">
                Welcome Back!
              </h3>
              <p className="text-base text-gray-500 mb-6 px-4">
                Sign in to access your projects, track progress, and stay connected with your team.
                Manage everything from one simple dashboard.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
