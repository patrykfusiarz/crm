import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config/api';

export default function Login() {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);
 const navigate = useNavigate();

 const handleSubmit = async (e) => {
   e.preventDefault();
   setLoading(true);
   setError('');

   try {
     const response = await fetch(getApiUrl('/api/auth/login'), {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({ email, password }),
     });

     const data = await response.json();

     if (response.ok) {
       localStorage.setItem('token', data.token);
       localStorage.setItem('user', JSON.stringify(data.user));
       navigate('/home');
     } else {
       setError(data.error || 'Login failed');
     }
   } catch (error) {
     console.error('Login error:', error);
     setError('Network error. Please try again.');
   } finally {
     setLoading(false);
   }
 };

 return (
   <div className="min-h-screen bg-[#ededf3] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
     <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
       <div className="bg-white py-8 px-4 shadow-sm border border-gray-200 rounded-lg sm:px-10">
         <h3 className="text-xl font-medium text-gray-900 mb-8">Log In</h3>
         <form className="space-y-6" onSubmit={handleSubmit}>
           <div>
             <label htmlFor="email" className="block text-xs font-medium text-gray-700">
               Email
             </label>
             <div className="mt-2">
               <input
                 id="email"
                 name="email"
                 type="email"
                 required
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="appearance-none block w-full px-3 py-2 border border-gray-200 rounded-md bg-[#fbfcfd] placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 hover:bg-white focus:bg-white sm:text-base"
               />
             </div>
           </div>

           <div>
             <label htmlFor="password" className="block text-xs font-medium text-gray-700">
               Password
             </label>
             <div className="mt-2">
               <div className="relative">
                 <input
                   id="password"
                   name="password"
                   type={showPassword ? "text" : "password"}
                   required
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-200 rounded-md bg-[#fbfcfd] placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 hover:bg-white focus:bg-white sm:text-base"
                 />
                 <button
                   type="button"
                   className="absolute inset-y-0 right-0 w-10 flex items-center group"
                   onClick={() => setShowPassword(!showPassword)}
                 >
                   <div className="w-full h-full flex items-center justify-center rounded-r border-l border-t border-r border-b border-gray-200 hover:bg-white transition-colors cursor-pointer"><svg className="h-4 w-4 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     {showPassword ? (
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
                     ) : (
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                     )}
                   </svg></div>
                 </button>
               </div>
             </div>
           </div>

           {error && (
             <div className="text-red-600 text-base text-center">
               {error}
             </div>
           )}

           <div className="pt-4">
             <button
               type="submit"
               disabled={loading}
               className="w-1/3 flex justify-center py-[8px] px-[14px] border border-transparent rounded-full shadow-sm text-base font-medium text-white bg-blue-300 hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
             >
               {loading ? 'Logging in...' : 'Log In'}
             </button>
           </div>
         </form>
       </div>
     </div>
   </div>
 );
}
