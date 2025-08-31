// import React, { useState } from "react";
// import { Navigate } from "react-router-dom";
// import { useAuth } from "../contexts/AuthContext";
// import { Eye, EyeOff } from "lucide-react";
// import LoadingSpinner from "../components/LoadingSpinner";
// import FloatingInput from "../components/FloatingInput";

// const Login: React.FC = () => {
//   const { user, login, loading } = useAuth();
//   const [formData, setFormData] = useState({ email: "", password: "" });
//   const [showPassword, setShowPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);

//   if (loading) return <LoadingSpinner />;
//   if (user) return <Navigate to="/dashboard" replace />;

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);
//     try {
//       await login(formData.email, formData.password);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   return (
//     <div className="relative min-h-screen w-full">
//       {/* Background split into 2 halves (top & bottom) */}
//       <div className="absolute inset-0 flex flex-col">
//         <div className="h-1/2 bg-blue-600"></div>
//         <div className="h-1/2 bg-[#f3f6ff]"></div>
//       </div>

//       {/* Card Positioned in Middle */}
//       <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
//         <div className="flex flex-col md:flex-row w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden">

//           {/* Left Side - Login Form */}
//           <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
//             <h2 className="text-2xl font-bold text-gray-800 mb-6">Login</h2>

//             <form onSubmit={handleSubmit}>
//               <FloatingInput
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 label="Email"
//               />

//               <div className="relative">
//                 <FloatingInput
//                   type={showPassword ? "text" : "password"}
//                   name="password"
//                   value={formData.password}
//                   onChange={handleChange}
//                   label="Password"
//                 />
//                 <button
//                   type="button"
//                   className="absolute right-2 top-3 text-gray-500 hover:text-gray-700"
//                   onClick={() => setShowPassword(!showPassword)}
//                 >
//                   {showPassword ? (
//                     <EyeOff className="h-5 w-5" />
//                   ) : (
//                     <Eye className="h-5 w-5" />
//                   )}
//                 </button>
//               </div>

//               <div className="flex items-center justify-between mt-2 text-sm">
//                 <label className="flex items-center space-x-2">
//                   <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
//                   <span className="text-gray-600">Remember me</span>
//                 </label>
//                 <a href="/forgot-password" className="text-blue-600 hover:underline">
//                   Forgot password?
//                 </a>
//               </div>

//               <button
//                 type="submit"
//                 disabled={isLoading}
//                 className={`mt-6 w-full py-2.5 rounded-lg font-semibold shadow-md transition duration-200 
//                   ${isLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
//               >
//                 Login
//               </button>
//             </form>

//             <p className="mt-6 text-sm text-gray-500 text-center">
//               Don’t have an account?{" "}
//               <a href="/register" className="text-blue-600 hover:underline font-medium">
//                 Sign up
//               </a>
//             </p>
//           </div>

//           {/* Right Side - Illustration & Info (hidden on mobile) */}
//           <div className="hidden md:flex w-full md:w-1/2 items-center justify-center p-10 bg-[#f9fafe]">
//             <div className="text-center w-full">
//               <img
//                 src="/images/login_img.png"
//                 alt="Login Illustration"
//                 className="mb-6 w-[90%] max-w-lg mx-auto"
//               />
//               <h3 className="text-2xl font-semibold mb-3 text-gray-800">
//                 Welcome Back!
//               </h3>
//               <p className="text-base text-gray-500 mb-6 px-4">
//                 Sign in to access your projects, track progress, and stay connected with your team.
//                 Manage everything from one simple dashboard.
//               </p>
//             </div>
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;


// import React, { useEffect, useState } from "react";
// import { Navigate, useNavigate } from "react-router-dom";
// import { useAuth } from "../contexts/AuthContext";
// import { BookOpen, Loader2 } from "lucide-react";
// import LoadingSpinner from "../components/LoadingSpinner";
// import FloatingInput from "../components/FloatingInput";
// import Loader from "../components/Loader"; // fullscreen success loader

// const Login: React.FC = () => {
//   const { user, login, loading } = useAuth();
//   const navigate = useNavigate();

//   const [formData, setFormData] = useState({ email: "", password: "" });
//   const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
//   const [remember, setRemember] = useState(true);
//   const [isLoading, setIsLoading] = useState(false);         // submitting state
//   const [successLoading, setSuccessLoading] = useState(false); // 3s screen after success

//   // Prefill from "remember me"
//   useEffect(() => {
//     const saved = localStorage.getItem("tp_login_email");
//     if (saved) setFormData((p) => ({ ...p, email: saved }));
//   }, []);

//   // 1) Auth context boot
//   if (loading) return <LoadingSpinner />;

//   // 2) Show fullscreen loader for 3s AFTER successful login (must be before the user redirect)
//   if (successLoading) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-white">
//         <Loader />
//       </div>
//     );
//   }

//   // 3) If already logged in (and NOT in successLoading phase) → go straight
//   if (user) return <Navigate to="/dashboard" replace />;

//   const validate = () => {
//     const e: typeof errors = {};
//     if (!formData.email.trim()) e.email = "Email is required.";
//     else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
//       e.email = "Enter a valid email.";
//     if (!formData.password) e.password = "Password is required.";
//     setErrors(e);
//     return Object.keys(e).length === 0;
//   };

//   const handleSubmit = async (ev: React.FormEvent) => {
//     ev.preventDefault();
//     if (!validate()) return;

//     setIsLoading(true);
//     try {
//       if (remember) localStorage.setItem("tp_login_email", formData.email);
//       else localStorage.removeItem("tp_login_email");

//       await login(formData.email, formData.password);

//       // ✅ Show fullscreen loader for 3 seconds, then navigate
//       setSuccessLoading(true);
//       setTimeout(() => {
//         navigate("/dashboard");
//       }, 2000);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//     if (errors[e.target.name as "email" | "password"]) {
//       setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
//     }
//   };

//   return (

//      <div className="relative min-h-screen w-full">
//       {/* Background split into 2 halves (top & bottom) */}
//       <div className="absolute inset-0 flex flex-col">
//        <div className="h-1/2 bg-blue-600"></div>
//         <div className="h-1/2 bg-[#f3f6ff]"></div>
//      </div>

//     <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-blue-100 via-indigo-100 to-violet-100">
//       {/* Decorative blobs */}
//       <div className="pointer-events-none absolute inset-0 opacity-50">
//         <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-blue-200 blur-3xl" />
//         <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-violet-200 blur-3xl" />
//       </div>

//       {/* Content */}
//       <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
//         <div className="w-full max-w-5xl overflow-hidden rounded-3xl shadow-2xl ring-1 ring-indigo-100 backdrop-blur-xl bg-white/70">
//           <div className="flex flex-col md:flex-row">
//             {/* Left: form */}
//             <div className="w-full md:w-1/2 p-8 sm:p-10">
//               <div className="mb-6 flex items-center gap-2">
//                    <BookOpen className="h-8 w-8 text-primary-600" />
//                 <span className="text-xl font-bold text-gray-900">TestPlatform</span>
//               </div>

//               <h2 className="mb-1 text-2xl font-bold text-gray-900">Welcome back</h2>
//               <p className="mb-6 text-sm text-gray-600">
//                 Sign in to continue to your dashboard.
//               </p>

//               <form onSubmit={handleSubmit} noValidate>
//                 {/* Email */}
//                 <div className="mb-4">
//                   <FloatingInput
//                     type="email"
//                     name="email"
//                     value={formData.email}
//                     onChange={handleChange}
//                     label="Email"
//                   />
//                   {errors.email && (
//                     <p className="mt-1 text-sm text-rose-600">{errors.email}</p>
//                   )}
//                 </div>

//                 {/* Password (default, no eye toggle) */}
//                 <div className="mb-2">
//                   <FloatingInput
//                     type="password"
//                     name="password"
//                     value={formData.password}
//                     onChange={handleChange}
//                     label="Password"
//                   />
//                   {errors.password && (
//                     <p className="mb-2 text-sm text-rose-600">{errors.password}</p>
//                   )}
//                 </div>

//                 {/* Row: remember + forgot */}
//                 <div className="mt-2 flex items-center justify-between text-sm">
//                   <label className="inline-flex cursor-pointer select-none items-center gap-2 text-gray-700">
//                     <input
//                       type="checkbox"
//                       className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
//                       checked={remember}
//                       onChange={(e) => setRemember(e.target.checked)}
//                     />
//                     Remember me
//                   </label>
//                   <a
//                     href="/forgot-password"
//                     className="font-medium text-indigo-600 hover:underline"
//                   >
//                     Forgot password?
//                   </a>
//                 </div>

//                 {/* Submit */}
//                 <button
//                   type="submit"
//                   disabled={isLoading}
//                   className={`group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white transition
//                     ${
//                       isLoading
//                         ? "bg-indigo-400 cursor-not-allowed"
//                         : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800"
//                     }
//                   `}
//                 >
//                   {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
//                   Log in
//                 </button>
//               </form>

//               <p className="mt-6 text-center text-xs text-gray-500">
//                 By continuing you agree to our Terms & Privacy Policy.
//               </p>
//             </div>

//             {/* Right: visual */}
//            <div className="hidden md:flex w-full md:w-1/2 items-center justify-center bg-gradient-to-br from-white to-[#5471d4] p-10">
//               <div className="w-full text-center">
//                 <img
//                   src="/images/login_img.png"
//                   alt="Illustration"
//                   className="mx-auto mb-6 w-[90%] max-w-md drop-shadow-xl"
//                 />
//                 <h3 className="mb-2 text-2xl font-semibold text-gray-900">
//                   Focus. Attempt. Excel.
//                 </h3>
//                 <p className="mx-auto max-w-md text-sm text-gray-600">
//                   Access exams, track performance, and stay on top of your goals—all in one.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//     </div>
//   );
// };

// export default Login;

// import React, { useEffect, useState } from "react";
// import { Navigate, useNavigate } from "react-router-dom";
// import { useAuth } from "../contexts/AuthContext";
// import { BookOpen, Loader2 } from "lucide-react";
// import LoadingSpinner from "../components/LoadingSpinner";
// import FloatingInput from "../components/FloatingInput";
// import Loader from "../components/Loader"; // fullscreen success loader

// const Login: React.FC = () => {
//   const { user, login, loading } = useAuth();
//   const navigate = useNavigate();

//   const [formData, setFormData] = useState({ email: "", password: "" });
//   const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
//   const [remember, setRemember] = useState(true);
//   const [isLoading, setIsLoading] = useState(false); // submitting
//   const [successLoading, setSuccessLoading] = useState(false); // fullscreen loader

//   useEffect(() => {
//     const saved = localStorage.getItem("tp_login_email");
//     if (saved) setFormData((p) => ({ ...p, email: saved }));
//   }, []);

//   if (loading) return <LoadingSpinner />;

//   if (successLoading) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-white">
//         <Loader />
//       </div>
//     );
//   }

//   if (user) return <Navigate to="/dashboard" replace />;

//   const validate = () => {
//     const e: typeof errors = {};
//     if (!formData.email.trim()) e.email = "Email is required.";
//     else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
//       e.email = "Enter a valid email.";
//     if (!formData.password) e.password = "Password is required.";
//     setErrors(e);
//     return Object.keys(e).length === 0;
//   };

//   const handleSubmit = async (ev: React.FormEvent) => {
//     ev.preventDefault();
//     if (!validate()) return;

//     setIsLoading(true);
//     try {
//       if (remember) localStorage.setItem("tp_login_email", formData.email);
//       else localStorage.removeItem("tp_login_email");

//       await login(formData.email, formData.password);

//       setSuccessLoading(true);
//       setTimeout(() => {
//         navigate("/dashboard");
//       }, 3000);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//     if (errors[e.target.name as "email" | "password"]) {
//       setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
//     }
//   };

//   return (
//     <div className="relative min-h-screen w-full overflow-hidden">
//       {/* --- Two-way split background --- */}
//       <div className="absolute inset-0 flex flex-col">
//         <div className="h-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-500" />
//         <div className="h-1/2 bg-gradient-to-tr from-white via-slate-50 to-indigo-50" />
//       </div>

//       {/* --- Decorative blobs for richness --- */}
//       <div className="pointer-events-none absolute inset-0">
//         <div className="absolute top-10 left-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
//         <div className="absolute bottom-10 right-10 h-52 w-52 rounded-full bg-blue-300/30 blur-3xl" />
//       </div>

//       {/* --- Centered Card --- */}
//       <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
//       <div className="w-full max-w-5xl rounded-3xl bg-white/90 backdrop-blur-xl shadow-[0_25px_80px_-15px_rgba(0,0,0,0.25)] overflow-hidden ring-1 ring-indigo-100">
//   {/* Content rows */}
//   <div className="flex flex-col md:flex-row">
//     {/* Left: form */}
//     <div className="w-full md:w-1/2 p-8 sm:p-10">
//       <div className="mb-6 flex items-center gap-2">
//         <BookOpen className="h-8 w-8 text-indigo-600" />
//         <span className="text-xl font-bold text-gray-900">TestPlatform</span>
//       </div>

//       <h2 className="mb-1 text-3xl font-bold text-gray-900">Welcome back</h2>
//       <p className="mb-6 text-sm text-gray-600">
//         Sign in to continue to your dashboard.
//       </p>

//       {/* Form inputs */}
//       <form onSubmit={handleSubmit} noValidate>
//         <div className="mb-4">
//           <FloatingInput
//             type="email"
//             name="email"
//             value={formData.email}
//             onChange={handleChange}
//             label="Email"
//           />
//           {errors.email && (
//             <p className="mt-1 text-sm text-rose-600">{errors.email}</p>
//           )}
//         </div>

//         <div className="mb-2">
//           <FloatingInput
//             type="password"
//             name="password"
//             value={formData.password}
//             onChange={handleChange}
//             label="Password"
//           />
//           {errors.password && (
//             <p className="mb-2 text-sm text-rose-600">{errors.password}</p>
//           )}
//         </div>

//         <div className="mt-2 flex items-center justify-between text-sm">
//           <label className="inline-flex cursor-pointer items-center gap-2 text-gray-700">
//             <input
//               type="checkbox"
//               className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
//               checked={remember}
//               onChange={(e) => setRemember(e.target.checked)}
//             />
//             Remember me
//           </label>
//           <a
//             href="/forgot-password"
//             className="font-medium text-indigo-600 hover:underline"
//           >
//             Forgot password?
//           </a>
//         </div>

//         <button
//           type="submit"
//           disabled={isLoading}
//           className={`group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white shadow-md transition
//             ${
//               isLoading
//                 ? "bg-indigo-400 cursor-not-allowed"
//                 : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800"
//             }
//           `}
//         >
//           {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
//           Log in
//         </button>
//       </form>
//     </div>

//     {/* Right visual */}
//     <div className="hidden md:flex w-full md:w-1/2 items-center justify-center p-10 bg-white">
//       <div className="w-full text-center">
//         <img
//           src="/images/login_img.png"
//           alt="Illustration"
//           className="mx-auto mb-6 w-[90%] max-w-md drop-shadow-xl"
//         />
//         <h3 className="mb-2 text-2xl font-semibold text-gray-900">
//           Focus. Attempt. Excel.
//         </h3>
//         <p className="mx-auto max-w-md text-sm text-gray-600">
//           Access exams, track performance, and stay on top of your goals—all in one.
//         </p>
//       </div>
//     </div>
//   </div>

//   {/* --- Blue Footer at bottom of card --- */}
//   <div className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 py-3 px-6 text-center">
//   </div>
// </div>

//       </div>
//     </div>
//   );
// };

// export default Login;

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
                <span className="text-xl font-bold text-gray-900">TestPlatform</span>
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
