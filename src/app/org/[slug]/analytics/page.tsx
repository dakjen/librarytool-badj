'use client';

import { useOrganization } from '@/context/OrganizationContext';
import { useEffect, useState } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  Clock, 
  Activity, 
  ArrowUpRight 
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsPage() {
  const { organization } = useOrganization();
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organization) {
      // Fetch analytics data (Mock for now)
      setTimeout(() => {
          setAnalyticsData({
              topItems: [
                  { title: "Introduction to Library Science", views: 150 },
                  { title: "Advanced Research Methods", views: 120 },
                  { title: "Digital Archives Overview", views: 90 },
                  { title: "Copyright Law Basics", views: 75 },
                  { title: "Information Literacy", views: 60 },
              ],
              userActivity: [
                  { date: 'Mon', activeUsers: 20 },
                  { date: 'Tue', activeUsers: 35 },
                  { date: 'Wed', activeUsers: 45 },
                  { date: 'Thu', activeUsers: 30 },
                  { date: 'Fri', activeUsers: 55 },
                  { date: 'Sat', activeUsers: 40 },
                  { date: 'Sun', activeUsers: 60 },
              ],
              contentTypes: [
                  { type: 'Videos', count: 45 },
                  { type: 'PDFs', count: 30 },
                  { type: 'Articles', count: 15 },
                  { type: 'Links', count: 10 },
              ]
          });
          setLoading(false);
      }, 1000);
    }
  }, [organization]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const primaryColor = organization?.primaryColor || '#003366';
  const secondaryColor = organization?.secondaryColor || '#B89E68';

  const barData = {
    labels: analyticsData.topItems.map((item: any) => item.title.substring(0, 15) + '...'),
    datasets: [
      {
        label: 'Views',
        data: analyticsData.topItems.map((item: any) => item.views),
        backgroundColor: primaryColor,
        borderRadius: 4,
        barThickness: 30,
      },
    ],
  };

  const lineData = {
    labels: analyticsData.userActivity.map((item: any) => item.date),
    datasets: [
      {
        label: 'Active Users',
        data: analyticsData.userActivity.map((item: any) => item.activeUsers),
        borderColor: secondaryColor,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, `${secondaryColor}66`); // 40% opacity
          gradient.addColorStop(1, `${secondaryColor}00`); // 0% opacity
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: secondaryColor,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const doughnutData = {
    labels: analyticsData.contentTypes.map((item: any) => item.type),
    datasets: [
      {
        data: analyticsData.contentTypes.map((item: any) => item.count),
        backgroundColor: [
          primaryColor,
          secondaryColor,
          '#800000', // Accent
          '#335c85', // Primary Light
        ],
        borderWidth: 0,
        hoverOffset: 4
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1a1a1a',
        titleFont: { family: 'DM Sans', size: 13 },
        bodyFont: { family: 'DM Sans', size: 13 },
        padding: 10,
        cornerRadius: 4,
        displayColors: false,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'DM Sans' }, color: '#666' }
      },
      y: {
        grid: { color: '#f0f0f0', borderDash: [5, 5] },
        ticks: { font: { family: 'DM Sans' }, color: '#666' },
        border: { display: false }
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8 font-sans bg-gray-50/30 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-primary mb-2 flex items-center gap-3">
            <Activity className="w-8 h-8 opacity-80" />
            Performance Insights
          </h1>
          <p className="text-gray-600 text-lg font-light">
            Track engagement and growth across your library.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
           <Clock className="w-4 h-4" />
           Last updated: Just now
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Users className="w-16 h-16 text-primary" />
              </div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Total Members</h3>
              <div className="flex items-end gap-2">
                 <p className="text-4xl font-bold text-gray-900">1,245</p>
                 <span className="text-green-500 text-sm font-medium flex items-center mb-1">
                    <ArrowUpRight className="w-3 h-3" /> 12%
                 </span>
              </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <BookOpen className="w-16 h-16 text-secondary-dark" />
              </div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Total Views</h3>
              <p className="text-4xl font-bold text-gray-900">8,520</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <TrendingUp className="w-16 h-16 text-accent" />
              </div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Avg. Session</h3>
              <div className="flex items-end gap-2">
                 <p className="text-4xl font-bold text-gray-900">12m</p>
                 <span className="text-green-500 text-sm font-medium flex items-center mb-1">
                    <ArrowUpRight className="w-3 h-3" /> 5%
                 </span>
              </div>
          </div>

           <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Activity className="w-16 h-16 text-blue-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Completion Rate</h3>
              <p className="text-4xl font-bold text-gray-900">78%</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* User Engagement Over Time (Main Chart) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-serif font-bold text-gray-800">User Activity</h2>
             <select className="text-sm border-gray-200 rounded-md text-gray-500 focus:ring-primary focus:border-primary">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>This Year</option>
             </select>
          </div>
          <div className="h-80">
             <Line data={lineData} options={chartOptions} />
          </div>
        </div>

         {/* Content Breakdown (Donut) */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <h2 className="text-xl font-serif font-bold text-gray-800 mb-6">Content Distribution</h2>
          <div className="h-64 relative flex-grow flex items-center justify-center">
            <Doughnut 
                data={doughnutData} 
                options={{
                    responsive: true, 
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'DM Sans', size: 12 } } } }
                }} 
            />
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                    <span className="block text-3xl font-bold text-gray-900">100</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Items</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Top Performing Content (Bar) */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-serif font-bold text-gray-800 mb-6">Most Viewed Content</h2>
          <div className="h-64">
            <Bar data={barData} options={chartOptions} />
          </div>
      </div>
    </div>
  );
}
