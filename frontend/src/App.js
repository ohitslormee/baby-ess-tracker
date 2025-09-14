import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import { Package, Scan, TrendingDown, AlertTriangle, Plus, Minus, Search, Baby, Settings as SettingsIcon } from 'lucide-react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import BarcodeScanner from './components/BarcodeScanner';
import InventoryDashboard from './components/InventoryDashboard';
import InventoryList from './components/InventoryList';
import ChildrenDetails from './components/ChildrenDetails';
import Settings from './components/Settings';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Navigation component
const Navigation = () => {
  const { colors } = useTheme();
  
  return (
    <nav className={`bg-gradient-to-r ${colors.nav} text-white shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <span className="text-xl font-bold">Caelestis</span>
          </div>
          <div className="flex space-x-4">
            <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-black/10 transition-colors">
              Dashboard
            </Link>
            <Link to="/scan" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-black/10 transition-colors">
              Scan
            </Link>
            <Link to="/inventory" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-black/10 transition-colors">
              Inventory
            </Link>
            <Link to="/children" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-black/10 transition-colors">
              Children
            </Link>
            <Link to="/settings" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-black/10 transition-colors">
              Settings
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Home/Dashboard component
const Home = () => {
  const { colors } = useTheme();
  const [stats, setStats] = useState({
    total_items: 0,
    low_stock_items: 0,
    out_of_stock_items: 0
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsResponse = await axios.get(`${API}/dashboard/stats`);
      setStats(statsResponse.data);
      
      // Fetch low stock items
      const lowStockResponse = await axios.get(`${API}/inventory/low-stock`);
      setLowStockItems(lowStockResponse.data);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className={`animate-spin rounded-full h-32 w-32 border-b-2 ${colors.primaryBorder}`}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Supply Dashboard</h1>
          <p className="text-gray-600 text-lg">Track your baby essentials with smart inventory management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
              <Package className={`h-4 w-4 ${colors.primaryText}`} />
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

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/scan">
              <Card className={`${colors.card} ${colors.primaryBorder} hover:bg-opacity-80 cursor-pointer transition-colors h-full`}>
                <CardContent className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <Scan className={`h-12 w-12 ${colors.primaryText} mx-auto mb-4`} />
                    <h3 className={`text-lg font-semibold ${colors.primaryText.replace('text-', 'text-').replace('-600', '-800')}`}>Scan Barcode</h3>
                    <p className={colors.primaryText}>Add new items or record usage</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/inventory">
              <Card className={`${colors.card} ${colors.primaryBorder} hover:bg-opacity-80 cursor-pointer transition-colors h-full`}>
                <CardContent className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <Search className={`h-12 w-12 ${colors.primaryText} mx-auto mb-4`} />
                    <h3 className={`text-lg font-semibold ${colors.primaryText.replace('text-', 'text-').replace('-600', '-800')}`}>View Inventory</h3>
                    <p className={colors.primaryText}>Browse and manage all items</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/children">
              <Card className={`${colors.card} ${colors.primaryBorder} hover:bg-opacity-80 cursor-pointer transition-colors h-full`}>
                <CardContent className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <Baby className={`h-12 w-12 ${colors.primaryText} mx-auto mb-4`} />
                    <h3 className={`text-lg font-semibold ${colors.primaryText.replace('text-', 'text-').replace('-600', '-800')}`}>Children Details</h3>
                    <p className={colors.primaryText}>Manage children information</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-800">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Low Stock Alert
              </CardTitle>
              <CardDescription className="text-orange-600">
                These items are running low and need restocking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                    <div>
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600">{item.category} • {item.brand}</p>
                    </div>
                    <Badge variant={item.current_stock === 0 ? "destructive" : "secondary"}>
                      {item.current_stock} {item.unit_type}
                    </Badge>
                  </div>
                ))}
              </div>
              {lowStockItems.length > 5 && (
                <div className="mt-4 text-center">
                  <Link to="/inventory">
                    <Button variant="outline" className="text-orange-700 border-orange-300 hover:bg-orange-100">
                      View All Low Stock Items
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Main App component with ThemeProvider wrapper
const AppContent = () => {
  return (
    <div className="App">
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scan" element={<BarcodeScanner />} />
          <Route path="/inventory" element={<InventoryList />} />
          <Route path="/dashboard" element={<InventoryDashboard />} />
          <Route path="/children" element={<ChildrenDetails />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;