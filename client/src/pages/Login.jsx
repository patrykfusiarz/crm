import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config/api';

export default function Login() {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
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
   <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
     <div className="sm:mx-auto sm:w-full sm:max-w-md">
       <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
         Sabrina is a bitch
       </h2>
     </div>

     <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
       <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
         <form className="space-y-6" onSubmit={handleSubmit}>
           <div>
             <label htmlFor="email" className="block text-sm font-medium text-gray-700">
               Email address
             </label>
             <div className="mt-1">
               <input
                 id="email"
                 name="email"
                 type="email"
                 required
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
               />
             </div>
           </div>

           <div>
             <label htmlFor="password" className="block text-sm font-medium text-gray-700">
               Password
             </label>
             <div className="mt-1">
               <input
                 id="password"
                 name="password"
                 type="password"
                 required
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
               />
             </div>
           </div>

           {error && (
             <div className="text-red-600 text-sm text-center">
               {error}
             </div>
           )}

           <div>
             <button
               type="submit"
               disabled={loading}
               className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
             >
               {loading ? 'Signing in...' : 'Sign in'}
             </button>
           </div>
         </form>

         <div className="mt-6">
           <div className="text-center">
             <p className="text-sm text-gray-600">
               Test credentials: admin@test.com / password
             </p>
           </div>
         </div>
       </div>
     </div>
   </div>
 );
}
