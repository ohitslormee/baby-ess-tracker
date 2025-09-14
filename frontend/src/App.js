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
import EditableQuantity from './components/EditableQuantity';
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
    <nav className={`bg-gradient-to-r ${colors.nav} text-white shadow-lg`} style={{backgroundColor: colors.navHex}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center py-2">
          <div className="flex items-center justify-center">
            <img 
              src="/caelestis-logo.svg" 
              alt="Caelestis la maison" 
              className="h-8 w-auto"
              style={{ width: '62%', maxWidth: '320px', minWidth: '200px' }}
            />
          </div>
        </div>
        
        {/* Desktop navigation */}
        <div className="hidden md:flex justify-center space-x-4 pb-2">
          <Link to="/" className="px-3 py-1 rounded-md text-base font-medium hover:bg-black/10 transition-colors">
            Dashboard
          </Link>
          <Link to="/scan" className="px-3 py-1 rounded-md text-base font-medium hover:bg-black/10 transition-colors">
            Scan
          </Link>
          <Link to="/inventory" className="px-3 py-1 rounded-md text-base font-medium hover:bg-black/10 transition-colors">
            Inventory
          </Link>
          <Link to="/children" className="px-3 py-1 rounded-md text-base font-medium hover:bg-black/10 transition-colors">
            Child
          </Link>
          <Link to="/settings" className="px-3 py-1 rounded-md text-base font-medium hover:bg-black/10 transition-colors">
            Settings
          </Link>
        </div>
        
        {/* Mobile navigation - single line */}
        <div className="md:hidden pb-1">
          <div className="flex justify-center space-x-1 overflow-x-auto">
            <Link to="/" className="px-2 py-1 rounded-md text-sm font-medium hover:bg-black/10 transition-colors whitespace-nowrap">
              Dashboard
            </Link>
            <Link to="/scan" className="px-2 py-1 rounded-md text-sm font-medium hover:bg-black/10 transition-colors whitespace-nowrap">
              Scan
            </Link>
            <Link to="/inventory" className="px-2 py-1 rounded-md text-sm font-medium hover:bg-black/10 transition-colors whitespace-nowrap">
              Inventory
            </Link>
            <Link to="/children" className="px-2 py-1 rounded-md text-sm font-medium hover:bg-black/10 transition-colors whitespace-nowrap">
              Child
            </Link>
            <Link to="/settings" className="px-2 py-1 rounded-md text-sm font-medium hover:bg-black/10 transition-colors whitespace-nowrap">
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
  const [inventoryItems, setInventoryItems] = useState([]);
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
      
      // Fetch all inventory items for individual cards
      const inventoryResponse = await axios.get(`${API}/inventory`);
      setInventoryItems(inventoryResponse.data);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (item) => {
    if (item.current_stock === 0) {
      return { text: 'Out of Stock', variant: 'destructive', color: 'text-red-600' };
    } else if (item.current_stock <= item.min_stock_alert) {
      return { text: 'Low Stock', variant: 'secondary', color: 'text-orange-600' };
    } else {
      return { text: 'In Stock', variant: 'default', color: 'text-green-600' };
    }
  };

  const addStock = async (itemId, quantity) => {
    try {
      await axios.post(`${API}/inventory/${itemId}/add-stock?quantity=${quantity}`);
      toast.success(`Added ${quantity} units`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error adding stock:', error);
      toast.error('Failed to add stock');
    }
  };

  const useItem = async (item, quantity) => {
    try {
      const usageData = {
        item_id: item.id,
        barcode: item.barcode,
        quantity_used: quantity
      };
      
      await axios.post(`${API}/inventory/${item.id}/use`, usageData);
      toast.success(`Used ${quantity} units of ${item.name}`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error using item:', error);
      toast.error(error.response?.data?.detail || 'Failed to record usage');
    }
  };

  const updateStock = async (item, newStock) => {
    try {
      await axios.put(`${API}/inventory/${item.id}`, {
        current_stock: newStock
      });
      toast.success(`Stock updated to ${newStock} units`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
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

        {/* Individual Item Cards */}
        {inventoryItems.length === 0 ? (
          <Card className="mb-8">
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No items in inventory</h3>
              <p className="text-gray-600 mb-4">Start by scanning some barcodes to add items to your inventory.</p>
              <Link to="/scan">
                <Button className={`${colors.button} text-white`}>
                  <Scan className="h-4 w-4 mr-2" />
                  Start Scanning
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Your Inventory</h2>
              <div className="text-sm text-gray-600">
                {inventoryItems.length} item{inventoryItems.length !== 1 ? 's' : ''} total
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {inventoryItems.map((item) => {
                const status = getStockStatus(item);
                
                return (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg truncate">{item.name}</CardTitle>
                        <Badge variant={status.variant} className="ml-2">
                          {status.text}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {item.category} {item.brand && `• ${item.brand}`}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${status.color}`}>
                          {item.current_stock}
                        </div>
                        <p className="text-sm text-gray-600">{item.unit_type} remaining</p>
                      </div>
                      
                      {item.current_stock <= item.min_stock_alert && (
                        <div className="flex items-center gap-2 text-sm text-orange-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Restock needed</span>
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            const qty = parseInt(prompt('How many units to add?') || '1');
                            if (qty > 0) addStock(item.id, qty);
                          }}
                          className="flex-1 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const qty = parseInt(prompt('How many units used?') || '1');
                            if (qty > 0) useItem(item, qty);
                          }}
                          disabled={item.current_stock === 0}
                          className="flex-1 text-xs"
                        >
                          <Minus className="h-3 w-3 mr-1" />
                          Use
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

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
                    <h3 className={`text-lg font-semibold ${colors.primaryText.replace('text-', 'text-').replace('-600', '-800')}`}>Child Details</h3>
                    <p className={colors.primaryText}>Manage child information</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
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