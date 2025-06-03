import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getApiUrl } from '../config/api';

export default function Layout({ children, title = "CRM Dashboard" }) {
 const navigate = useNavigate();
 const location = useLocation();
 const [user, setUser] = useState(null);
 const [sidebarOpen, setSidebarOpen] = useState(false);

 useEffect(() => {
   const token = localStorage.getItem('token');
   const userData = localStorage.getItem('user');
   
   if (!token) {
     navigate('/login');
     return;
   }
   
   if (userData) {
     setUser(JSON.parse(userData));
   }
 }, [navigate]);

 const handleLogout = async () => {
   try {
     const token = localStorage.getItem('token');
     if (token) {
       await fetch(getApiUrl('/api/auth/logout'), {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${token}`,
           'Content-Type': 'application/json',
         },
       });
     }
   } catch (error) {
     console.error('Logout error:', error);
   } finally {
     localStorage.removeItem('token');
     localStorage.removeItem('user');
     navigate('/login');
   }
 };

 const handleAddDeal = () => {
   navigate('/clients', { state: { openModal: true } });
 };

 const isActive = (path) => location.pathname === path;

 if (!user) {
   return (
     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
       <div className="text-lg">Loading...</div>
     </div>
   );
 }

 return (
   <div className="min-h-screen bg-gray-50 flex">
     {/* Mobile sidebar overlay */}
     {sidebarOpen && (
       <div 
         className="fixed inset-0 z-40 lg:hidden"
         onClick={() => setSidebarOpen(false)}
       >
         <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
       </div>
     )}

     {/* Sidebar */}
     <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex lg:flex-col ${
       sidebarOpen ? 'translate-x-0' : '-translate-x-full'
     }`}>
       <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
         <h2 className="text-lg font-semibold text-gray-900">CRM System</h2>
         <button
           onClick={() => setSidebarOpen(false)}
           className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600"
         >
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
           </svg>
         </button>
       </div>

       <nav className="flex-1 mt-8 px-4">
         <div className="space-y-2">
           <button
             onClick={() => navigate('/home')}
             className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
               isActive('/home') 
                 ? 'bg-indigo-100 text-indigo-700' 
                 : 'text-gray-700 hover:bg-gray-100'
             }`}
           >
             <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
             </svg>
             Dashboard
           </button>

           <button
             onClick={() => navigate('/clients')}
             className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
               isActive('/clients') 
                 ? 'bg-indigo-100 text-indigo-700' 
                 : 'text-gray-700 hover:bg-gray-100'
             }`}
           >
             <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
             </svg>
             Clients & Deals
           </button>

           <div className="border-t border-gray-200 pt-4 mt-4">
             <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
               Quick Actions
             </p>
             <button
               onClick={handleAddDeal}
               className="w-full flex items-center px-3 py-2 mt-2 text-sm font-medium text-green-700 hover:bg-green-50 rounded-md transition-colors"
             >
               <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
               </svg>
               Add Deal
             </button>
           </div>

           <div className="border-t border-gray-200 pt-4 mt-4">
             <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
               Coming Soon
             </p>
             <div className="mt-2 space-y-1">
               <div className="flex items-center px-3 py-2 text-sm text-gray-400">
                 <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                 </svg>
                 Tasks
               </div>
               <div className="flex items-center px-3 py-2 text-sm text-gray-400">
                 <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 002 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 002 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                 </svg>
                 Reports
               </div>
             </div>
           </div>
         </div>
       </nav>

       {/* User section at bottom */}
       <div className="p-4 border-t border-gray-200">
         <div className="flex items-center">
           <div className="flex-shrink-0">
             <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
               <span className="text-sm font-medium text-white">
                 {user?.email?.charAt(0).toUpperCase()}
               </span>
             </div>
           </div>
           <div className="ml-3 flex-1 min-w-0">
             <p className="text-sm font-medium text-gray-900 truncate">
               {user?.firstName && user?.lastName 
                 ? `${user.firstName} ${user.lastName}`
                 : user?.username || user?.email
               }
             </p>
             <p className="text-xs text-gray-500 truncate">{user?.email}</p>
           </div>
         </div>
         <div className="mt-3 space-y-1">
           <button
             onClick={() => navigate('/account')}
             className="w-full flex items-center px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
           >
             <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
             </svg>
             Account
           </button>
           <button
             onClick={handleLogout}
             className="w-full flex items-center px-2 py-1 text-sm text-red-700 hover:bg-red-50 rounded-md"
           >
             <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
             </svg>
             Logout
           </button>
         </div>
       </div>
     </div>

     {/* Main content */}
     <div className="flex-1 flex flex-col min-w-0">
       {/* Top navbar */}
       <header className="bg-white shadow-sm border-b border-gray-200">
         <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
           <div className="flex items-center space-x-4">
             <button
               onClick={() => setSidebarOpen(true)}
               className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
               </svg>
             </button>
             <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
           </div>
           
           <div className="flex items-center space-x-4">
             <span className="hidden sm:block text-sm text-gray-700">
               Welcome, {user?.firstName && user?.lastName 
                 ? `${user.firstName} ${user.lastName}`
                 : user?.email
               }
             </span>
             
             <button
               onClick={handleAddDeal}
               className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium"
             >
               Add Deal
             </button>
           </div>
         </div>
       </header>

       {/* Page content */}
       <main className="flex-1 py-6">
         {children}
       </main>
     </div>
   </div>
 );
}
