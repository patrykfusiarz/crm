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
        setData(result.data);
        console.log("Chart data received:", result.data);
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

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      if (timeframe === 'current_month') {
        const currentDate = new Date();
        const monthName = currentDate.toLocaleString('default', { month: 'long' });
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
            <p className="text-gray-700">{`${monthName} ${label} : ${value} deals`}</p>
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
      {/* Two Column Layout - 70/30 split */}
      <div className="grid grid-cols-10 gap-6 h-full">
        {/* Left Column - Chart (7/10 = 70%) */}
        <div className="col-span-7">
          <div className="bg-white rounded-lg border border-gray-200 p-0 h-full flex flex-col">
            {/* Chart Header with Toggle Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 p-6 pb-0">
              <h2 className="text-4xl font-normal text-gray-900 mb-4 sm:mb-0">
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
            <div className="flex-1 min-h-96">
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

        {/* Right Column - Empty Sidebar (3/10 = 30%) */}
        <div className="col-span-3">
          <div className="bg-white rounded-lg border border-gray-200 p-6 h-full flex flex-col">
            {/* Empty sidebar - ready for future features */}
            <div className="flex-1">
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
