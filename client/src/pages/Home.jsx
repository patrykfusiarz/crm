import { useState, useEffect } from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getApiUrl, getAuthHeaders } from '../config/api';

export default function Home() {
 const [timeframe, setTimeframe] = useState('current_month');
 const [chartKey, setChartKey] = useState(0);
 const [data, setData] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');

 // Force chart re-render on window resize
 useEffect(() => {
   const handleResize = () => {
     setChartKey(prev => prev + 1);
   };

   window.addEventListener('resize', handleResize);
   return () => window.removeEventListener('resize', handleResize);
 }, []);

 // Fetch data when timeframe changes
 useEffect(() => {
   fetchDashboardData();
 }, [timeframe]);

 const fetchDashboardData = async () => {
   try {
     setLoading(true);
     setError('');
     
     const response = await fetch(getApiUrl(`/api/dashboard/deals-data/${timeframe}`), {
       headers: getAuthHeaders()
     });

     if (response.ok) {
       const result = await response.json();
       console.log("Chart data received:", result.data);
       setData(result.data);
     } else {
       setError('Failed to load dashboard data');
     }
   } catch (error) {
     console.error('Dashboard fetch error:', error);
     setError('Network error loading dashboard data');
   } finally {
     setLoading(false);
   }
 };

// Force rebuild - tooltip fix
 // Custom tooltip component
 const CustomTooltip = ({ active, payload, label }) => {
   console.log("Tooltip debug - label:", label, "payload:", payload);

   if (active && payload && payload.length) {
     const value = payload[0].value;
     if (timeframe === 'current_month') {
       const currentDate = new Date();
       const monthName = currentDate.toLocaleString('default', { month: 'long' });
       return (
         <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
           <p className="text-gray-700">{`${monthName} ${label}: ${value} deals`}</p>
         </div>
       );
     }
     return (
       <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
         <p className="text-gray-700">{`${value} deals`}</p>
       </div>
     );
   }
   return null;
 };

 // Get the last day of current month
 const getLastDayOfMonth = () => {
   return new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
 };

 return (
   <div className="h-full flex flex-col max-w-[2000px] mx-auto px-6 lg:px-17">
     <div className="pt-[10px] pb-[18px]">
       <h1 className="text-3xl font-medium text-gray-900">Welcome, {JSON.parse(localStorage.getItem("user") || "{}")?.firstName || "User"}</h1>
     </div>
     
     {/* Quick Action Buttons */}
     <div className="mb-6 mt-4">
       <div className="flex space-x-3">
         <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 cursor-pointer transition-colors">
           <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
           </svg>
           Send
         </button>
         
         <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 cursor-pointer transition-colors">
           <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
           </svg>
           Request
         </button>
         
         <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 cursor-pointer transition-colors">
           <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
           </svg>
           Transfer
         </button>
         
         <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 cursor-pointer transition-colors">
           <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
           </svg>
           Deposit
         </button>
         
         <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 cursor-pointer transition-colors">
           <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
           </svg>
           Pay Bill
         </button>
         
         <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 cursor-pointer transition-colors">
           <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
           </svg>
           Create Invoice
         </button>
       </div>
     </div>
     
     {/* Chart Container - 65% of remaining height */}
     <div className="flex-[65] mb-8">
       <div className="bg-white rounded-lg border border-gray-200 p-0 h-full flex flex-col shadow-lg shadow-gray-200/50">
         {/* Chart Header with Toggle Buttons */}
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 p-4 pb-0">
           <h2 className="text-3xl font-normal text-gray-900 mb-2 sm:mb-0">
             {data.length > 0 ? data[data.length - 1].deals : 0} Deals
           </h2>
           
           {/* Time Frame Toggle Buttons */}
           <div className="flex rounded-lg bg-gray-100 p-1">
             <button
               onClick={() => setTimeframe('current_month')}
               className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                 timeframe === 'current_month'
                   ? 'bg-white text-indigo-700 shadow-sm'
                   : 'text-gray-500 hover:text-gray-700'
               }`}
             >
               Month
             </button>
             <button
               onClick={() => setTimeframe('last_3_months')}
               className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                 timeframe === 'last_3_months'
                   ? 'bg-white text-indigo-700 shadow-sm'
                   : 'text-gray-500 hover:text-gray-700'
               }`}
             >
               90 Days
             </button>
             <button
               onClick={() => setTimeframe('year_to_date')}
               className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                 timeframe === 'year_to_date'
                   ? 'bg-white text-indigo-700 shadow-sm'
                   : 'text-gray-500 hover:text-gray-700'
               }`}
             >
               YTD
             </button>
           </div>
         </div>

         {/* Error Message */}
         {error && (
           <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-6">
             {error}
           </div>
         )}

         {/* Chart Container */}
         <div className="flex-1">
           {loading ? (
             <div className="flex items-center justify-center h-full">
               <div className="text-lg text-gray-500">Loading chart data...</div>
             </div>
           ) : (
             <ResponsiveContainer width="100%" height="100%" key={chartKey}>
               <ComposedChart
                 data={data}
                 margin={{
                   top: 0,
                   right: 0,
                   left: 0,
                   bottom: 0,
                 }}
               >
                 <defs>
                   <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.6} />
                     <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.1} />
                   </linearGradient>
                 </defs>
                 <XAxis dataKey="period" hide />
                 <YAxis domain={[0, 25]} hide />
                 <Tooltip content={<CustomTooltip />} />
                 <Area
                   type="monotone"
                   dataKey="deals"
                   stroke="none"
                   fill="url(#chartGradient)"
                 />
                 <Line
                   type="monotone" connectNulls={false}
                   dataKey="deals"
                   stroke="#60a5fa"
                   strokeWidth={3}
                   dot={false}
                   activeDot={{
                     r: 8,
                     fill: '#60a5fa',
                     strokeWidth: 2,
                     stroke: '#ffffff'
                   }}
                 />
               </ComposedChart>
             </ResponsiveContainer>
           )}
         </div>

         {/* Bottom container with custom X-axis */}
         <div className="bg-white p-4 border-t border-gray-200 rounded-b-lg">
           <div className="flex justify-between text-xs text-gray-500">
             {timeframe === 'current_month' && (
               <>
                 <span>1</span>
                 <span>7</span>
                 <span>14</span>
                 <span>21</span>
                 <span>{getLastDayOfMonth()}</span>
               </>
             )}
             {timeframe === 'last_3_months' && (
               <>
                 <span>Mar</span>
                 <span>Apr</span>
                 <span>May</span>
               </>
             )}
             {timeframe === 'year_to_date' && 
               ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                 .slice(0, new Date().getMonth() + 1)
                 .map((month) => (
                   <span key={month}>{month}</span>
                 ))
             }
           </div>
         </div>
       </div>
     </div>

     {/* Stats Container - 4 columns with 25% each */}
     <div className="pb-4">
       <div className="bg-white rounded-lg border border-gray-200 h-auto p-[36px] shadow-lg shadow-gray-200/50">
         <div className="flex items-start">
           <div className="flex-[25] pl-6">
             <div className="text-[48px] font-medium leading-none -mt-2 pb-3 text-gray-900">2</div>
             <div className="text-base font-medium text-gray-500 leading-none">Overdue</div>
           </div>
           <div className="border-r border-gray-300 mx-6 h-16"></div>
           <div className="flex-[25] pl-6">
             <div className="text-[48px] font-medium leading-none -mt-2 pb-3 text-gray-900">9</div>
             <div className="text-base font-medium text-gray-500 leading-none">Due in next 7 days</div>
           </div>
           <div className="border-r border-gray-300 mx-6 h-16"></div>
           <div className="flex-[25] pl-6">
             <div className="text-[48px] font-medium leading-none -mt-2 pb-3 text-gray-900">20</div>
             <div className="text-base font-medium text-gray-500 leading-none">Days left in May</div>
           </div>
           <div className="border-r border-gray-300 mx-6 h-16"></div>
           <div className="flex-[25] pl-6">
             <div className="text-[48px] font-medium leading-none -mt-2 pb-3 text-gray-900">15</div>
             <div className="text-base font-medium text-gray-500 leading-none">New this month</div>
           </div>
         </div>
       </div>
     </div>
   </div>
 );
}
