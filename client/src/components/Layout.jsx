import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getApiUrl } from '../config/api';

export default function Layout({ children, title = "CRM Dashboard" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar - Always visible */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200">
        {/* User section at top */}
        <div className="flex items-center h-[65px] px-4 border-b border-gray-200">
          <div className="flex items-center ml-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center">
                <span className="text-base font-normal text-white">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-base font-semibold text-gray-900 truncate">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.username || user?.email
                }
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 mt-8 px-4">
          <div className="space-y-2">
            <button
              onClick={() => navigate("/home")}
              className={`w-full flex items-center px-3 py-2 text-base font-normal rounded-md transition-colors ${
                isActive("/home") 
                  ? "bg-gray-100 text-gray-900" 
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg className={`w-5 h-5 mr-3 ${isActive("/home") ? "text-blue-600" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              Home
            </button>

            <button
              onClick={() => navigate("/liveview")}
              className={`w-full flex items-center px-3 py-2 text-base font-normal rounded-md transition-colors ${
                isActive("/liveview") 
                  ? "bg-gray-100 text-gray-900" 
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg className={`w-5 h-5 mr-3 ${isActive("/liveview") ? "text-blue-600" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              Live View
            </button>

            <button
              onClick={() => navigate("/clients")}
              className={`w-full flex items-center px-3 py-2 text-base font-normal rounded-md transition-colors ${
                isActive("/clients") 
                  ? "bg-gray-100 text-gray-900" 
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg className={`w-5 h-5 mr-3 ${isActive("/clients") ? "text-blue-600" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              Clients
            </button>
          </div>
        </nav>        {/* Account/Logout section at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="space-y-1">
            <button
              onClick={() => navigate('/account')}
              className="w-full flex items-center px-3 py-2 text-base font-normal rounded-md transition-colors text-gray-700 hover:bg-gray-100"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Account
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-base font-normal rounded-md transition-colors text-gray-700 hover:bg-gray-100"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 ml-64">
       {/* Top navbar - Always visible */}
       <header className="bg-white border-b border-gray-200 fixed top-0 right-0 left-64 z-40">
         <div className="max-w-[2000px] mx-auto flex items-center h-16 px-6 lg:px-17">
           <div className="flex-1">
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                 </svg>
               </div>
               <input
                 type="text"
                 placeholder="Search..."
                 className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
               />
             </div>
           </div>
           
           <button
             onClick={handleAddDeal}
             className="ml-4 bg-white hover:bg-gray-50 text-blue-600 px-10 py-2 rounded-full border border-gray-300 text-sm font-medium"
           >
             Add Deal
           </button>
         </div>
       </header>
        {/* Page content */}
        <main className="flex-1 py-6 pt-24">
          {children}
        </main>
      </div>
    </div>
  );
}
