import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Plus, Minus, Edit, Trash2, Search, Filter, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { toast } from 'sonner';
import EditableQuantity from './EditableQuantity';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InventoryList = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const categories = [
    'all',
    'Diapers',
    'Wet Wipes', 
    'Food & Formula',
    'Bath & Care',
    'Medicine & Health',
    'Toys & Entertainment',
    'Clothing',
    'Other'
  ];

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, categoryFilter, stockFilter]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/inventory`);
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...items];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.barcode.includes(searchTerm)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Stock filter
    if (stockFilter === 'low') {
      filtered = filtered.filter(item => item.current_stock <= item.min_stock_alert && item.current_stock > 0);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(item => item.current_stock === 0);
    } else if (stockFilter === 'good') {
      filtered = filtered.filter(item => item.current_stock > item.min_stock_alert);
    }

    setFilteredItems(filtered);
  };

  const getStockStatus = (item) => {
    if (item.current_stock === 0) {
      return { text: 'Out of Stock', variant: 'destructive', icon: AlertTriangle };
    } else if (item.current_stock <= item.min_stock_alert) {
      return { text: 'Low Stock', variant: 'secondary', icon: AlertTriangle };
    } else {
      return { text: 'In Stock', variant: 'default', icon: Package };
    }
  };

  const addStock = async (itemId, quantity) => {
    try {
      await axios.post(`${API}/inventory/${itemId}/add-stock?quantity=${quantity}`);
      toast.success(`Added ${quantity} units`);
      fetchInventory();
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
      fetchInventory();
    } catch (error) {
      console.error('Error using item:', error);
      toast.error(error.response?.data?.detail || 'Failed to record usage');
    }
  };

  const updateItem = async (updatedItem) => {
    try {
      await axios.put(`${API}/inventory/${updatedItem.id}`, updatedItem);
      toast.success('Item updated successfully');
      setShowEditDialog(false);
      setEditingItem(null);
      fetchInventory();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  };

  const updateStock = async (item, newStock) => {
    try {
      await axios.put(`${API}/inventory/${item.id}`, {
        current_stock: newStock
      });
      toast.success(`Stock updated to ${newStock} units`);
      fetchInventory();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    }
  };

  const updateMinStockAlert = async (item, newMinStock) => {
    try {
      await axios.put(`${API}/inventory/${item.id}`, {
        min_stock_alert: newMinStock
      });
      toast.success(`Low stock alert updated to ${newMinStock} units`);
      fetchInventory();
    } catch (error) {
      console.error('Error updating min stock alert:', error);
      toast.error('Failed to update min stock alert');
    }
  };

  const handleQuickAdd = (item) => {
    const quantity = parseInt(prompt('How many units to add?') || '1');
    if (quantity > 0) {
      addStock(item.id, quantity);
    }
  };

  const handleQuickUse = (item) => {
    const quantity = parseInt(prompt('How many units used?') || '1');
    if (quantity > 0) {
      useItem(item, quantity);
    }
  };

  const handleAddOne = (item) => {
    addStock(item.id, 1);
  };

  const handleUseOne = (item) => {
    useItem(item, 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Inventory Management</h1>
          <p className="text-gray-600 text-lg">Manage your baby supplies inventory</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="stock">Stock Level</Label>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="good">In Stock</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('all');
                    setStockFilter('all');
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900">{filteredItems.length}</div>
              <p className="text-sm text-gray-600">Total Items</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {filteredItems.filter(item => item.current_stock > item.min_stock_alert).length}
              </div>
              <p className="text-sm text-gray-600">In Stock</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">
                {filteredItems.filter(item => item.current_stock <= item.min_stock_alert && item.current_stock > 0).length}
              </div>
              <p className="text-sm text-gray-600">Low Stock</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {filteredItems.filter(item => item.current_stock === 0).length}
              </div>
              <p className="text-sm text-gray-600">Out of Stock</p>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Grid */}
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600">Try adjusting your filters or scan some barcodes to add items.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="inventory-grid">
            {filteredItems.map((item) => {
              const status = getStockStatus(item);
              const StatusIcon = status.icon;
              
              return (
                <Card key={item.id} className="card-hover">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{item.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <span>{item.category}</span>
                          {item.brand && (
                            <>
                              <span>•</span>
                              <span>{item.brand}</span>
                            </>
                          )}
                        </CardDescription>
                      </div>
                      <Badge variant={status.variant}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.text}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Current Stock</p>
                        <p className="font-semibold text-lg">
                          <EditableQuantity
                            value={item.current_stock}
                            onSave={(newStock) => updateStock(item, newStock)}
                            className="font-semibold text-lg"
                            inputClassName="font-semibold text-lg text-center w-16"
                            min={0}
                          /> {item.unit_type}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Low Stock Alert</p>
                        <p className="font-semibold text-lg">
                          <EditableQuantity
                            value={item.min_stock_alert}
                            onSave={(newMinStock) => updateMinStockAlert(item, newMinStock)}
                            className="font-semibold text-lg"
                            inputClassName="font-semibold text-lg text-center w-16"
                            min={0}
                          /> {item.unit_type}
                        </p>
                      </div>
                    </div>
                    
                    {item.size && (
                      <div className="text-sm">
                        <p className="text-gray-600">Size</p>
                        <p className="font-medium">{item.size}</p>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      <p>Barcode: {item.barcode}</p>
                      {item.last_used && (
                        <p>Last used: {new Date(item.last_used).toLocaleDateString()}</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleQuickAdd(item)}
                        className="flex-1"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickUse(item)}
                        disabled={item.current_stock === 0}
                        className="flex-1"
                      >
                        <Minus className="h-4 w-4 mr-1" />
                        Use
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingItem(item);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
              <DialogDescription>Update item information</DialogDescription>
            </DialogHeader>
            
            {editingItem && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem(prev => ({...prev, name: e.target.value}))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-stock">Current Stock</Label>
                    <Input
                      id="edit-stock"
                      type="number"
                      value={editingItem.current_stock}
                      onChange={(e) => setEditingItem(prev => ({...prev, current_stock: parseInt(e.target.value) || 0}))}
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-alert">Low Stock Alert</Label>
                    <Input
                      id="edit-alert"
                      type="number"
                      value={editingItem.min_stock_alert}
                      onChange={(e) => setEditingItem(prev => ({...prev, min_stock_alert: parseInt(e.target.value) || 0}))}
                      min="0"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit-brand">Brand</Label>
                  <Input
                    id="edit-brand"
                    value={editingItem.brand || ''}
                    onChange={(e) => setEditingItem(prev => ({...prev, brand: e.target.value}))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-size">Size</Label>
                  <Input
                    id="edit-size"
                    value={editingItem.size || ''}
                    onChange={(e) => setEditingItem(prev => ({...prev, size: e.target.value}))}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => updateItem(editingItem)}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default InventoryList;