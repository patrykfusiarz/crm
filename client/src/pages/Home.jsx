import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

  const getChartTitle = () => {
    switch(timeframe) {
      case 'current_month': return 'Current Month Deals';
      case 'last_3_months': return 'Last 3 Months Deals';
      case 'year_to_date': return 'Year to Date Deals';
      default: return 'Deals Overview';
    }
  };

  const getXAxisTicks = () => {
    if (timeframe === 'current_month' && data.length > 0) {
      const maxDay = Math.max(...data.map(d => parseInt(d.period)));
      const ticks = [1, 7, 14, 21];
      
      // Add 28 if month is long enough
      if (maxDay >= 28) ticks.push(28);
      
      // Add final day of month
      if (maxDay > 28) ticks.push(maxDay);
      
      return ticks;
    }
    return undefined; // Let Recharts handle other timeframes automatically
  };

  const formatTooltip = (value, name, props) => {
    if (timeframe === 'current_month') {
      const currentDate = new Date();
      const monthName = currentDate.toLocaleString('default', { month: 'long' });
      return [`${value} deals`, `${monthName} ${props.payload.period}`];
    }
    return [`${value} deals`, 'Completed Deals'];
  };

  return (
    <div className="h-full flex flex-col max-w-[2000px] mx-auto px-6 lg:px-17">
      {/* Chart Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 flex-1 flex flex-col">
        {/* Chart Header with Toggle Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-0">
            {getChartTitle()}
          </h2>
          
          {/* Time Frame Toggle Buttons */}
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setTimeframe('current_month')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                timeframe === 'current_month'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Current Month
            </button>
            <button
              onClick={() => setTimeframe('last_3_months')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                timeframe === 'last_3_months'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Last 3 Months
            </button>
            <button
              onClick={() => setTimeframe('year_to_date')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                timeframe === 'year_to_date'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Year to Date
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
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
              <LineChart
                data={data}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="period" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  ticks={getXAxisTicks()}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ color: '#374151' }}
                  formatter={formatTooltip}
                />
                <Line
                  type="monotone" connectNulls={false}
                  dataKey="deals"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{
                    fill: '#4f46e5',
                    strokeWidth: 2,
                    r: 6
                  }}
                  activeDot={{
                    r: 8,
                    fill: '#4f46e5',
                    strokeWidth: 2,
                    stroke: '#ffffff'
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart Footer with Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              Total deals in selected period: <span className="font-semibold text-gray-900">
                {data.reduce((sum, item) => sum + item.deals, 0)}
              </span>
            </span>
            <span>
              Last updated: {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
