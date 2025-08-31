// import React, { useState } from 'react';
// import { Link, useLocation, useNavigate } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
// import {
//   LayoutDashboard,
//   FileText,
//   Users,
//   Building2,
//   HelpCircle,
//   BarChart3,
//   User,
//   LogOut,
//   Menu,
//   X,
//   BookOpen,
//   Trophy
// } from 'lucide-react';
// import { IoPersonSharp } from "react-icons/io5";

// interface LayoutProps {
//   children: React.ReactNode;
// }

// const Layout: React.FC<LayoutProps> = ({ children }) => {
//   const { user, logout } = useAuth();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [showLogoutModal, setShowLogoutModal] = useState(false);

//   const handleLogoutConfirm = () => {
//     logout();
//     navigate("/login");
//   };

//   const navigation = [
//     { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['superadmin', 'contentadmin', 'trainer', 'student', 'centeradmin'] },
//     { name: 'Institutes', href: '/institutes', icon: Building2, roles: ['superadmin'] },
//     { name: 'Exams', href: '/exams', icon: Trophy, roles: ['superadmin', 'centeradmin'] },
//     { name: 'Question Sets', href: '/questionsets', icon: HelpCircle, roles: ['superadmin', 'contentadmin', 'trainer'] },
//     { name: 'Course', href: '/courses', icon: Building2, roles: ['superadmin', 'centeradmin'] },
//     { name: 'Tests', href: '/view-tests', icon: FileText, roles: ['superadmin', 'contentadmin', 'trainer', 'student', 'centeradmin'] },
//     { name: 'Random Tests', href: '/view-random-tests', icon: FileText, roles: ['superadmin', 'contentadmin', 'trainer', 'student', 'centeradmin'] },
//     { name: 'Questions', href: '/questions', icon: HelpCircle, roles: ['superadmin', 'contentadmin', 'trainer'] },
//     { name: 'Results', href: '/results', icon: BarChart3, roles: ['superadmin', 'contentadmin', 'trainer', 'student', 'centeradmin'] },
//     { name: 'Users', href: '/users', icon: Users, roles: ['superadmin', 'centeradmin'] },
//     { name: 'Centers', href: '/centers', icon: Building2, roles: ['superadmin', 'centeradmin'] },
//   ];

//   const filteredNavigation = navigation.filter(item =>
//     item.roles.includes(user?.role || '')
//   );

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Mobile sidebar */}
//       <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
//         <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
//         <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
//           <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
//             <div className="flex items-center space-x-2">
//               <BookOpen className="h-8 w-8 text-primary-600" />
//               <span className="text-xl font-bold text-gray-900">TestPlatform</span>
//             </div>
//             <button
//               onClick={() => setSidebarOpen(false)}
//               className="text-gray-400 hover:text-gray-600"
//             >
//               <X className="h-6 w-6" />
//             </button>
//           </div>
//           <nav className="flex-1 px-4 py-4 space-y-2">
//             {filteredNavigation.map((item) => {
//               const Icon = item.icon;
//               const isActive = location.pathname === item.href;
//               return (
//                 <Link
//                   key={item.name}
//                   to={item.href}
//                   onClick={() => setSidebarOpen(false)}
//                   className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
//                       ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
//                       : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
//                     }`}
//                 >
//                   <Icon className="mr-3 h-5 w-5" />
//                   {item.name}
//                 </Link>
//               );
//             })}
//           </nav>
//         </div>
//       </div>

//       {/* Desktop sidebar */}
//       <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
//         <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
//           <div className="flex items-center h-16 px-4 border-b border-gray-200">
//             <div className="flex items-center space-x-2">
//               <BookOpen className="h-8 w-8 text-primary-600" />
//               <span className="text-xl font-bold text-gray-900">TestPlatform</span>
//             </div>
//           </div>
//           <nav className="flex-1 px-4 py-4 space-y-2">
//             {filteredNavigation.map((item) => {
//               const Icon = item.icon;
//               const isActive = location.pathname === item.href;
//               return (
//                 <Link
//                   key={item.name}
//                   to={item.href}
//                   className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
//                       ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
//                       : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
//                     }`}
//                 >
//                   <Icon className="mr-3 h-5 w-5" />
//                   {item.name}
//                 </Link>
//               );
//             })}
//           </nav>
//         </div>
//       </div>

//       {/* Main content */}
//       <div className="lg:pl-64">
//         {/* Top bar */}
//         <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
//           <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
//             {/* Mobile menu button */}
//             <button
//               onClick={() => setSidebarOpen(true)}
//               className="text-gray-500 hover:text-gray-600 lg:hidden"
//             >
//               <Menu className="h-6 w-6" />
//             </button>

//             {/* Right side - Profile only */}
//             <div className="ml-auto flex items-center space-x-3">
//               <div
//                 className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
//               >
//                 <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
//                   <IoPersonSharp className="h-5 w-5 text-blue-600" />
//                 </div>
//                 <div className="hidden sm:block text-left">
//                   <p className="text-sm font-medium text-gray-900">{user?.role}</p>
//                   <p className="text-xs text-gray-500 capitalize">{user?.email}</p>
//                 </div>
//               </div>

//               <button
//                 onClick={() => setShowLogoutModal(true)}
//                 className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
//               >
//                 <LogOut className="h-5 w-5" />
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Page content */}
//         <main className="p-4 sm:p-6 lg:p-8">
//           <div className="max-w-7xl mx-auto">
//             {children}
//           </div>
//         </main>
//       </div>

//       {/* Logout Confirmation Modal */}
//       {showLogoutModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
//           <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
//             <h3 className="text-lg font-semibold text-gray-800">Confirm Logout</h3>
//             <p className="text-sm text-gray-600 mt-2">
//               Are you sure you want to logout?
//             </p>
//             <div className="flex justify-end space-x-3 mt-6">
//               <button
//                 onClick={() => setShowLogoutModal(false)}
//                 className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleLogoutConfirm}
//                 className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
//               >
//                 Logout
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Layout;

// import React, { useState } from "react";
// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { useAuth } from "../contexts/AuthContext";
// import {
//   LayoutDashboard,
//   FileText,
//   Users,
//   Building2,
//   FileQuestion,
//   BarChart3,
//   LogOut,
//   Menu,
//   X,
//   ClipboardList,
//   Shuffle,
//   GraduationCap,
//   BookOpen,
// } from "lucide-react";
// import { IoPersonSharp } from "react-icons/io5";

// const RailTooltip: React.FC<{ label: string }> = ({ label }) => (
//   <div
//     className="
//       absolute left-full top-1/2 -translate-y-1/2 ml-3
//       whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg
//       opacity-0 pointer-events-none group-hover:opacity-100
//       transition-opacity duration-150
//     "
//     role="tooltip"
//   >
//     {label}
//   </div>
// );

// interface LayoutProps {
//   children: React.ReactNode;
// }

// const Layout: React.FC<LayoutProps> = ({ children }) => {
//   const { user, logout } = useAuth();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [showLogoutModal, setShowLogoutModal] = useState(false);

//   const handleLogoutConfirm = () => {
//     logout();
//     navigate("/login");
//   };

//   const navigation = [
//     { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["superadmin", "contentadmin", "trainer", "student", "centeradmin"] },
//     { name: "Institutes", href: "/institutes", icon: GraduationCap, roles: ["superadmin"] },
//     { name: "Exams", href: "/exams", icon: ClipboardList, roles: ["superadmin", "centeradmin"] },
//     { name: "Question Sets", href: "/questionsets", icon: FileQuestion, roles: ["superadmin", "contentadmin", "trainer"] },
//     { name: "Courses", href: "/courses", icon: BookOpen, roles: ["superadmin", "centeradmin"] },
//     { name: "Tests", href: "/view-tests", icon: FileText, roles: ["superadmin", "contentadmin", "trainer", "student", "centeradmin"] },
//     { name: "Random Tests", href: "/view-random-tests", icon: Shuffle, roles: ["superadmin", "contentadmin", "trainer", "student", "centeradmin"] },
//     { name: "Questions", href: "/questions", icon: FileQuestion, roles: ["superadmin", "contentadmin", "trainer"] },
//     { name: "Results", href: "/results", icon: BarChart3, roles: ["superadmin", "contentadmin", "trainer", "student", "centeradmin"] },
//     { name: "Users", href: "/users", icon: Users, roles: ["superadmin", "centeradmin"] },
//     { name: "Centers", href: "/centers", icon: Building2, roles: ["superadmin", "centeradmin"] },
//   ];

//   const filteredNavigation = navigation.filter((item) =>
//     item.roles.includes(user?.role || "")
//   );

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Mobile sidebar */}
//       <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
//         <div
//           className="fixed inset-0 bg-gray-900/50"
//           onClick={() => setSidebarOpen(false)}
//         />
//         <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-blue-700 shadow-2xl text-white">
//           {/* Drawer header */}
//           <div className="flex h-16 items-center justify-between px-4 border-b border-blue-500">
//             <div className="flex items-center space-x-2">
//               <BookOpen className="h-8 w-8 text-white animate-bounce" />
//               <span className="text-xl font-bold">TestPlatform</span>
//             </div>
//             <button
//               onClick={() => setSidebarOpen(false)}
//               className="text-white hover:text-gray-200"
//             >
//               <X className="h-6 w-6" />
//             </button>
//           </div>
//           <nav className="flex-1 px-3 py-4 space-y-1">
//             {filteredNavigation.map((item) => {
//               const Icon = item.icon;
//               const isActive = location.pathname === item.href;
//               return (
//                 <Link
//                   key={item.name}
//                   to={item.href}
//                   onClick={() => setSidebarOpen(false)}
//                   className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition
//                     ${
//                       isActive
//                         ? "bg-white text-blue-700 shadow-md"
//                         : "hover:bg-blue-600"
//                     }`}
//                 >
//                   <Icon className="h-5 w-5" />
//                   <span>{item.name}</span>
//                 </Link>
//               );
//             })}
//           </nav>
//         </div>
//       </div>

//     {/* Desktop Sidebar */}
// <aside className="hidden lg:fixed lg:inset-y-0 lg:flex">
//   <div className="flex h-full w-20 flex-col items-center bg-blue-700 text-white shadow-xl">
    
//     {/* 🔵 Rail top (logo area, same size as nav buttons) */}
//     <div className="flex h-12 w-12 items-center justify-center mt-4 mb-2 rounded-xl bg-blue-600 shadow-md">
//       <BookOpen className="h-7 w-7 text-white animate-pulse" />
//     </div>

//     {/* Nav icons */}
//     <nav className="flex-1 py-4 flex flex-col items-center gap-2">
//       {filteredNavigation.map((item) => {
//         const Icon = item.icon;
//         const isActive = location.pathname === item.href;
//         return (
//           <Link
//             key={item.name}
//             to={item.href}
//             aria-label={item.name}
//             className={`
//               group relative flex h-12 w-12 items-center justify-center rounded-xl
//               transition-all hover:bg-blue-600
//               ${isActive ? "bg-white text-blue-700 shadow-lg scale-105" : ""}
//             `}
//           >
//             <Icon
//               className={`h-6 w-6 transition
//                 ${isActive ? "text-blue-700" : "text-white group-hover:text-gray-100"}
//               `}
//             />
//             <RailTooltip label={item.name} />
//           </Link>
//         );
//       })}
//     </nav>
//   </div>
// </aside>


//       {/* Main */}
//       <div className="lg:pl-20">
//         {/* Top bar */}
//         <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
//           <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
//             <div className="flex items-center gap-3">
//               <button
//                 onClick={() => setSidebarOpen(true)}
//                 className="text-gray-600 hover:text-gray-800 lg:hidden"
//                 aria-label="Open menu"
//               >
//                 <Menu className="h-6 w-6" />
//               </button>
//               <div className="flex items-center gap-2">
//                 <BookOpen className="h-6 w-6 text-blue-700" />
//                 <span className="text-lg font-semibold text-gray-900">TestPlatform</span>
//               </div>
//             </div>

//             {/* Right: Profile */}
//             <div className="ml-auto flex items-center space-x-3">
//               <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
//                 <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
//                   <IoPersonSharp className="h-5 w-5 text-blue-700" />
//                 </div>
//                 <div className="hidden sm:block text-left">
//                   <p className="text-sm font-medium text-gray-900 capitalize">{user?.role}</p>
//                   <p className="text-xs text-gray-500">{user?.email}</p>
//                 </div>
//               </div>
//               <button
//                 onClick={() => setShowLogoutModal(true)}
//                 className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
//                 aria-label="Logout"
//               >
//                 <LogOut className="h-5 w-5" />
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Page content */}
//         <main className="p-4 sm:p-6 lg:p-8">
//           <div className="max-w-7xl mx-auto">{children}</div>
//         </main>
//       </div>

//       {/* Logout Modal */}
//       {showLogoutModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//           <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
//             <h3 className="text-lg font-semibold text-gray-800">Confirm Logout</h3>
//             <p className="text-sm text-gray-600 mt-2">
//               Are you sure you want to logout?
//             </p>
//             <div className="flex justify-end space-x-3 mt-6">
//               <button
//                 onClick={() => setShowLogoutModal(false)}
//                 className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleLogoutConfirm}
//                 className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
//               >
//                 Logout
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Layout;

// import React, { useState } from "react";
// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { useAuth } from "../contexts/AuthContext";
// import {
//   LayoutDashboard,
//   FileText,
//   Users,
//   Building2,
//   FileQuestion,
//   BarChart3,
//   LogOut,
//   Menu,
//   X,
//   ClipboardList,
//   Shuffle,
//   GraduationCap,
//   BookOpen,
//   Bell,
// } from "lucide-react";
// import { IoPersonSharp } from "react-icons/io5";

// const RailTooltip: React.FC<{ label: string }> = ({ label }) => (
//   <div
//     className="
//       absolute left-full top-1/2 -translate-y-1/2 ml-3
//       whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg
//       opacity-0 pointer-events-none group-hover:opacity-100
//       transition-opacity duration-150
//     "
//     role="tooltip"
//   >
//     {label}
//   </div>
// );

// interface LayoutProps {
//   children: React.ReactNode;
// }

// const Layout: React.FC<LayoutProps> = ({ children }) => {
//   const { user, logout } = useAuth();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [showLogoutModal, setShowLogoutModal] = useState(false);

//   const handleLogoutConfirm = () => {
//     logout();
//     navigate("/login");
//   };

//   const navigation = [
//     { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["superadmin", "contentadmin", "trainer", "student", "centeradmin"] },
//     { name: "Institutes", href: "/institutes", icon: GraduationCap, roles: ["superadmin"] },
//     { name: "Exams", href: "/exams", icon: ClipboardList, roles: ["superadmin", "centeradmin"] },
//     { name: "Question Sets", href: "/questionsets", icon: FileQuestion, roles: ["superadmin", "contentadmin", "trainer"] },
//     { name: "Courses", href: "/courses", icon: BookOpen, roles: ["superadmin", "centeradmin"] },
//     { name: "Tests", href: "/view-tests", icon: FileText, roles: ["superadmin", "contentadmin", "trainer", "student", "centeradmin"] },
//     { name: "Random Tests", href: "/view-random-tests", icon: Shuffle, roles: ["superadmin", "contentadmin", "trainer", "student", "centeradmin"] },
//     { name: "Questions", href: "/questions", icon: FileQuestion, roles: ["superadmin", "contentadmin", "trainer"] },
//     { name: "Results", href: "/results", icon: BarChart3, roles: ["superadmin", "contentadmin", "trainer", "student", "centeradmin"] },
//     { name: "Users", href: "/users", icon: Users, roles: ["superadmin", "centeradmin"] },
//     { name: "Centers", href: "/centers", icon: Building2, roles: ["superadmin", "centeradmin"] },
//   ];

//   const filteredNavigation = navigation.filter((item) =>
//     item.roles.includes(user?.role || "")
//   );

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Mobile sidebar */}
//       <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
//         <div
//           className="fixed inset-0 bg-gray-900/50"
//           onClick={() => setSidebarOpen(false)}
//         />
//         <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-blue-700 shadow-2xl text-white">
//           <div className="flex h-16 items-center justify-between px-4 border-b border-blue-500">
//             <div className="flex items-center space-x-2">
//               <BookOpen className="h-8 w-8 text-white animate-bounce" />
//               <span className="text-xl font-bold">TestPlatform</span>
//             </div>
//             <button
//               onClick={() => setSidebarOpen(false)}
//               className="text-white hover:text-gray-200"
//             >
//               <X className="h-6 w-6" />
//             </button>
//           </div>
//           <nav className="flex-1 px-3 py-4 space-y-1">
//             {filteredNavigation.map((item) => {
//               const Icon = item.icon;
//               const isActive = location.pathname === item.href;
//               return (
//                 <Link
//                   key={item.name}
//                   to={item.href}
//                   onClick={() => setSidebarOpen(false)}
//                   className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition
//                     ${
//                       isActive
//                         ? "bg-white text-blue-700 shadow-md"
//                         : "hover:bg-blue-600"
//                     }`}
//                 >
//                   <Icon className="h-5 w-5" />
//                   <span>{item.name}</span>
//                 </Link>
//               );
//             })}
//           </nav>
//         </div>
//       </div>

//       {/* Desktop Sidebar */}
//       <aside className="hidden lg:fixed lg:inset-y-0 lg:flex">
//         <div className="flex h-full w-16 flex-col items-center bg-blue-700 text-white shadow-xl">
//           {/* 🔵 Rail top (logo) */}
//           <div className="flex h-10 w-10 items-center justify-center mt-3 mb-3 rounded-lg bg-blue-600 shadow-md">
//             <BookOpen className="h-6 w-6 text-white animate-pulse" />
//           </div>
//           {/* Nav icons */}
//           <nav className="flex-1 py-2 flex flex-col items-center gap-1 w-full">
//             {filteredNavigation.map((item, idx) => {
//               const Icon = item.icon;
//               const isActive = location.pathname === item.href;
//               return (
//                 <React.Fragment key={item.name}>
//                   <Link
//                     to={item.href}
//                     aria-label={item.name}
//                     className={`
//                       group relative flex h-10 w-10 mx-auto items-center justify-center rounded-lg
//                       transition-all hover:bg-blue-600
//                       ${isActive ? "bg-white text-blue-700 shadow-md scale-105" : ""}
//                     `}
//                   >
//                     <Icon
//                       className={`h-5 w-5 transition
//                         ${isActive ? "text-blue-700" : "text-white group-hover:text-gray-100"}
//                       `}
//                     />
//                     <RailTooltip label={item.name} />
//                   </Link>
//                   {idx < filteredNavigation.length - 1 && (
//                     <div className="h-px w-6 bg-white/20 mx-auto" />
//                   )}
//                 </React.Fragment>
//               );
//             })}
//           </nav>
//         </div>
//       </aside>

//       {/* Main */}
//       <div className="lg:pl-16">
//         {/* Top bar */}
//         <div className="sticky top-0 z-40 bg-white border-b-4 border-blue-700 shadow-sm">
//           <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
//             <div className="flex items-center gap-3">
//               <button
//                 onClick={() => setSidebarOpen(true)}
//                 className="text-gray-600 hover:text-gray-800 lg:hidden"
//                 aria-label="Open menu"
//               >
//                 <Menu className="h-6 w-6" />
//               </button>
//               <div className="flex items-center gap-2">
//                 <BookOpen className="h-6 w-6 text-blue-700" />
//                 <span className="text-xl font-bold text-gray-900">TestPlatform</span>
//               </div>
//             </div>

//             {/* Right: Bell + Profile + Logout */}
//             <div className="ml-auto flex items-center space-x-3">
//               <button className="relative p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors">
//                 <Bell className="h-5 w-5" />
//                 <span className="absolute top-1 right-1 inline-flex h-2 w-2 rounded-full bg-red-500"></span>
//               </button>
//               <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
//                 <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
//                   <IoPersonSharp className="h-5 w-5 text-blue-700" />
//                 </div>
//                 <div className="hidden sm:block text-left">
//                   <p className="text-sm font-bold text-gray-900 capitalize">{user?.role}</p>
//                   <p className="text-xs text-gray-500">{user?.email}</p>
//                 </div>
//               </div>
//               <button
//                 onClick={() => setShowLogoutModal(true)}
//                 className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
//                 aria-label="Logout"
//               >
//                 <LogOut className="h-5 w-5" />
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Page content */}
//         <main className="p-4 sm:p-6 lg:p-8">
//           <div className="max-w-7xl mx-auto">{children}</div>
//         </main>
//       </div>

//       {/* Logout Modal */}
//       {showLogoutModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
//           <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-fade-in">
//             <h3 className="text-lg font-semibold text-gray-800">Confirm Logout</h3>
//             <p className="text-sm text-gray-600 mt-2">
//               Are you sure you want to log out of your account?
//             </p>
//             <div className="flex justify-end space-x-3 mt-6">
//               <button
//                 onClick={() => setShowLogoutModal(false)}
//                 className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleLogoutConfirm}
//                 className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 shadow-md transition"
//               >
//                 Logout
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Layout;

import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  FileQuestion,
  BarChart3,
  LogOut,
  Menu,
  X,
  ClipboardList,
  Shuffle,
  GraduationCap,
  BookOpen,
  Bell,
} from "lucide-react";
import { IoPersonSharp } from "react-icons/io5";

const RailTooltip: React.FC<{ label: string }> = ({ label }) => (
  <div
    className="
      absolute left-full top-1/2 -translate-y-1/2 ml-3
      whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg
      opacity-0 pointer-events-none group-hover:opacity-100
      transition-opacity duration-150
    "
    role="tooltip"
  >
    {label}
  </div>
);

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogoutConfirm = () => {
    logout();
    navigate("/login");
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["superadmin", "contentadmin", "trainer", "student", "centeradmin"] },
    { name: "Institutes", href: "/institutes", icon: GraduationCap, roles: ["superadmin"] },
    { name: "Exams", href: "/exams", icon: ClipboardList, roles: ["superadmin", "centeradmin"] },
    { name: "Question Sets", href: "/questionsets", icon: FileQuestion, roles: ["superadmin", "contentadmin", "trainer"] },
    { name: "Courses", href: "/courses", icon: BookOpen, roles: ["superadmin", "centeradmin"] },
    { name: "Tests", href: "/view-tests", icon: FileText, roles: ["superadmin", "contentadmin", "trainer", "student", "centeradmin"] },
    { name: "Random Tests", href: "/view-random-tests", icon: Shuffle, roles: ["superadmin", "contentadmin", "trainer", "student", "centeradmin"] },
    { name: "Questions", href: "/questions", icon: FileQuestion, roles: ["superadmin", "contentadmin", "trainer"] },
    { name: "Results", href: "/results", icon: BarChart3, roles: ["superadmin", "contentadmin", "trainer", "student", "centeradmin"] },
    { name: "Users", href: "/users", icon: Users, roles: ["superadmin", "centeradmin"] },
    { name: "Centers", href: "/centers", icon: Building2, roles: ["superadmin", "centeradmin"] },
  ];

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user?.role || "")
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div
          className="fixed inset-0 bg-gray-900/50"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-blue-700 shadow-2xl text-white">
          <div className="flex h-16 items-center justify-between px-4 border-b border-blue-500">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-white animate-bounce" />
              <span className="text-xl font-bold">TestPlatform</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition
                    ${
                      isActive
                        ? "bg-white text-blue-700 shadow-md"
                        : "hover:bg-blue-600"
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex">
        <div className="flex h-full w-16 flex-col items-center bg-blue-700 text-white shadow-xl">
          {/* 🔵 Rail top (logo) */}
          <div className="flex h-10 w-10 items-center justify-center mt-3 mb-3 rounded-lg bg-blue-600 shadow-md">
            <BookOpen className="h-6 w-6 text-white animate-pulse" />
          </div>
          {/* Nav icons */}
          <nav className="flex-1 py-2 flex flex-col items-center gap-1 w-full">
            {filteredNavigation.map((item, idx) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <React.Fragment key={item.name}>
                  <Link
                    to={item.href}
                    aria-label={item.name}
                    className={`group relative flex h-10 w-10 mx-auto items-center justify-center rounded-lg
                      transition-all hover:bg-blue-600
                      ${isActive ? "bg-white text-blue-700 shadow-md scale-105" : ""}`}
                  >
                    <Icon
                      className={`h-5 w-5 transition
                        ${isActive ? "text-blue-700" : "text-white group-hover:text-gray-100"}`}
                    />
                    <RailTooltip label={item.name} />
                  </Link>
                  {idx < filteredNavigation.length - 1 && (
                    <div className="h-px w-6 bg-white/20 mx-auto" />
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-16">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white border-b-4 border-blue-700 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-600 hover:text-gray-800 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-blue-700" />
                <span className="text-xl font-bold text-gray-900">TestPlatform</span>
              </div>
            </div>

            {/* Right: Bell + Profile + Logout */}
            <div className="ml-auto flex items-center space-x-3 relative">
              {/* 🔔 Notifications */}
              <button
                className="relative p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setShowNotifications((prev) => !prev)}
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 inline-flex h-2 w-2 rounded-full bg-red-500"></span>
              </button>

              {/* Floater */}
              {showNotifications && (
                <div className="absolute right-12 top-12 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-fade-in">
                  <div className="p-3 text-sm text-gray-600">
                    <p className="font-medium text-gray-800">Notifications</p>
                    <div className="mt-2 text-center text-gray-500 text-sm py-6">
                      No notifications
                    </div>
                  </div>
                </div>
              )}

              {/* Profile */}
              <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                  <IoPersonSharp className="h-5 w-5 text-blue-700" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-bold text-gray-900 capitalize">{user?.role}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={() => setShowLogoutModal(true)}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                aria-label="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-800">Confirm Logout</h3>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to log out of your account?
            </p>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 shadow-md transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
