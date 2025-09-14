import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, TrendingDown, AlertTriangle, Clock, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InventoryDashboard = () => {
  const [stats, setStats] = useState({
    total_items: 0,
    low_stock_items: 0,
    out_of_stock_items: 0
  });
  const [recentUsage, setRecentUsage] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const [statsResponse, usageResponse, inventoryResponse] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/usage-logs?limit=10`),
        axios.get(`${API}/inventory`)
      ]);
      
      setStats(statsResponse.data);
      setRecentUsage(usageResponse.data);
      
      // Calculate category breakdown
      const inventory = inventoryResponse.data;
      const breakdown = inventory.reduce((acc, item) => {
        const category = item.category || 'Other';
        if (!acc[category]) {
          acc[category] = { count: 0, total_stock: 0, low_stock: 0 };
        }
        acc[category].count += 1;
        acc[category].total_stock += item.current_stock;
        if (item.current_stock <= item.min_stock_alert) {
          acc[category].low_stock += 1;
        }
        return acc;
      }, {});
      
      setCategoryBreakdown(Object.entries(breakdown).map(([category, data]) => ({
        category,
        ...data
      })));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600 text-lg">Detailed insights into your baby supplies</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
              <Package className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.total_items}</div>
              <p className="text-xs text-gray-500 mt-1">Items in inventory</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Low Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.low_stock_items}</div>
              <p className="text-xs text-gray-500 mt-1">Items need restocking</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Out of Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.out_of_stock_items}</div>
              <p className="text-xs text-gray-500 mt-1">Items out of stock</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Category Breakdown
              </CardTitle>
              <CardDescription>Items and stock levels by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryBreakdown.map((category) => (
                  <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{category.category}</h4>
                      <p className="text-sm text-gray-600">
                        {category.count} items • {category.total_stock} total units
                      </p>
                    </div>
                    {category.low_stock > 0 && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        {category.low_stock} low
                      </Badge>
                    )}
                  </div>
                ))}
                {categoryBreakdown.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No inventory data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Usage
              </CardTitle>
              <CardDescription>Latest items used from inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsage.map((usage) => (
                  <div key={usage.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Used {usage.quantity_used} units</p>
                      <p className="text-sm text-gray-600">
                        {new Date(usage.timestamp).toLocaleDateString()} at{' '}
                        {new Date(usage.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {usage.barcode}
                    </Badge>
                  </div>
                ))}
                {recentUsage.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent usage recorded</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Insights */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Usage Insights</CardTitle>
            <CardDescription>Key statistics about your inventory usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{recentUsage.length}</div>
                <p className="text-sm text-blue-800">Recent Activities</p>
                <p className="text-xs text-blue-600 mt-1">Last 10 usage records</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((stats.total_items - stats.out_of_stock_items) / Math.max(stats.total_items, 1) * 100)}%
                </div>
                <p className="text-sm text-green-800">Availability Rate</p>
                <p className="text-xs text-green-600 mt-1">Items currently in stock</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{categoryBreakdown.length}</div>
                <p className="text-sm text-purple-800">Categories</p>
                <p className="text-xs text-purple-600 mt-1">Different product types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InventoryDashboard;