import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { Camera, Plus, Minus, Package, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { useTheme } from '../contexts/ThemeContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BarcodeScanner = () => {
  const { colors } = useTheme();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [scanMode, setScanMode] = useState('detect'); // 'detect', 'add', 'use'
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [productInfo, setProductInfo] = useState(null);
  const [existingItem, setExistingItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Other',
    brand: '',
    size: '',
    unit_type: 'pieces',
    current_stock: 0,
    min_stock_alert: 5
  });

  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  const categories = [
    'Diapers',
    'Wet Wipes', 
    'Food & Formula',
    'Bath & Care',
    'Medicine & Health',
    'Toys & Entertainment',
    'Clothing',
    'Other'
  ];

  const unitTypes = [
    'pieces',
    'bottles',
    'packs',
    'boxes',
    'tubes',
    'jars',
    'cans'
  ];

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = () => {
    if (isScanning) return;

    setIsScanning(true);
    
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 150 },
      aspectRatio: 1.5,
      disableFlip: false,
    };

    html5QrCodeRef.current = new Html5QrcodeScanner(
      "barcode-scanner", 
      config,
      false
    );

    html5QrCodeRef.current.render(onScanSuccess, onScanFailure);
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.clear().then(() => {
        setIsScanning(false);
        html5QrCodeRef.current = null;
      }).catch(err => {
        console.error("Failed to clear scanner", err);
        setIsScanning(false);
        html5QrCodeRef.current = null;
      });
    }
  };

  const onScanSuccess = async (decodedText) => {
    console.log("Scanned barcode:", decodedText);
    setScannedBarcode(decodedText);
    stopScanner();
    await handleBarcodeScanned(decodedText);
  };

  const onScanFailure = (error) => {
    // We can ignore scan failures as they happen frequently during scanning
    console.log("Scan failed:", error);
  };

  const handleBarcodeScanned = async (barcode) => {
    setIsLoading(true);
    try {
      // Check if item already exists in inventory
      try {
        const existingResponse = await axios.get(`${API}/inventory/barcode/${barcode}`);
        setExistingItem(existingResponse.data);
        
        if (scanMode === 'detect') {
          // Show quantity dialog for existing item
          setShowQuantityDialog(true);
        } else if (scanMode === 'add') {
          // Add stock to existing item
          const addQuantity = parseInt(prompt('How many units to add?') || '1');
          await addStockToItem(existingResponse.data.id, addQuantity);
        } else if (scanMode === 'use') {
          // Use item
          const useQuantity = parseInt(prompt('How many units used?') || '1');
          await useItem(existingResponse.data.id, useQuantity, barcode);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          // Item doesn't exist, try to look up product info
          await lookupNewProduct(barcode);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error handling barcode:', error);
      toast.error('Failed to process barcode');
    } finally {
      setIsLoading(false);
    }
  };

  const lookupNewProduct = async (barcode) => {
    try {
      const response = await axios.post(`${API}/products/lookup/${barcode}`);
      const productData = response.data;
      
      if (productData.found) {
        setProductForm({
          name: productData.product_name || '',
          category: productData.category || 'Other',
          brand: productData.brand || '',
          size: productData.size || '',
          unit_type: 'pieces',
          current_stock: 0,
          min_stock_alert: 5
        });
        setProductInfo(productData);
      } else {
        // No product info found, user needs to enter manually
        setProductForm({
          name: '',
          category: 'Other',
          brand: '',
          size: '',
          unit_type: 'pieces',
          current_stock: 0,
          min_stock_alert: 5
        });
        setProductInfo(null);
      }
      
      setShowProductDialog(true);
    } catch (error) {
      console.error('Error looking up product:', error);
      toast.error('Failed to lookup product information');
    }
  };

  const createNewItem = async () => {
    try {
      const itemData = {
        barcode: scannedBarcode,
        ...productForm
      };
      
      const response = await axios.post(`${API}/inventory`, itemData);
      toast.success(`Added new item: ${response.data.name}`);
      setShowProductDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error creating item:', error);
      toast.error(error.response?.data?.detail || 'Failed to create item');
    }
  };

  const addStockToItem = async (itemId, quantity) => {
    try {
      const response = await axios.post(`${API}/inventory/${itemId}/add-stock?quantity=${quantity}`);
      toast.success(response.data.message);
      setShowQuantityDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error adding stock:', error);
      toast.error('Failed to add stock');
    }
  };

  const useItem = async (itemId, quantity, barcode) => {
    try {
      const usageData = {
        item_id: itemId,
        barcode: barcode,
        quantity_used: quantity
      };
      
      await axios.post(`${API}/inventory/${itemId}/use`, usageData);
      toast.success(`Used ${quantity} units of ${existingItem?.name}`);
      setShowQuantityDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error using item:', error);
      toast.error(error.response?.data?.detail || 'Failed to record usage');
    }
  };

  const resetForm = () => {
    setScannedBarcode('');
    setExistingItem(null);
    setProductInfo(null);
    setQuantity(1);
    setProductForm({
      name: '',
      category: 'Other',
      brand: '',
      size: '',
      unit_type: 'pieces',
      current_stock: 0,
      min_stock_alert: 5
    });
  };

  const getScanModeDisplay = () => {
    switch (scanMode) {
      case 'add':
        return { text: 'Add Stock', color: 'bg-green-100 text-green-800', icon: Plus };
      case 'use':
        return { text: 'Use Item', color: 'bg-red-100 text-red-800', icon: Minus };
      default:
        return { text: 'Auto Detect', color: 'bg-blue-100 text-blue-800', icon: Package };
    }
  };

  const modeDisplay = getScanModeDisplay();
  const ModeIcon = modeDisplay.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Barcode Scanner</h1>
          <p className="text-gray-600 text-lg">Scan barcodes to add items or record usage</p>
        </div>

        {/* Scan Mode Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ModeIcon className="h-5 w-5" />
              Scan Mode
            </CardTitle>
            <CardDescription>Choose what happens when you scan a barcode</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant={scanMode === 'detect' ? 'default' : 'outline'}
                onClick={() => setScanMode('detect')}
                className="h-16 flex flex-col items-center gap-2"
              >
                <Package className="h-6 w-6" />
                <span>Auto Detect</span>
              </Button>
              <Button
                variant={scanMode === 'add' ? 'default' : 'outline'}
                onClick={() => setScanMode('add')}
                className="h-16 flex flex-col items-center gap-2"
              >
                <Plus className="h-6 w-6" />
                <span>Add Stock</span>
              </Button>
              <Button
                variant={scanMode === 'use' ? 'default' : 'outline'}
                onClick={() => setScanMode('use')}
                className="h-16 flex flex-col items-center gap-2"
              >
                <Minus className="h-6 w-6" />
                <span>Use Item</span>
              </Button>
            </div>
            <div className="mt-4">
              <Badge className={modeDisplay.color}>
                <ModeIcon className="h-4 w-4 mr-1" />
                Current Mode: {modeDisplay.text}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Scanner */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Camera Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isScanning ? (
              <div className="text-center py-8">
                <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Ready to scan barcodes</p>
                <Button onClick={startScanner} className="btn-primary">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="scanner-container">
                  <div id="barcode-scanner" className="w-full"></div>
                </div>
                <Button onClick={stopScanner} variant="outline" className="w-full">
                  <X className="h-4 w-4 mr-2" />
                  Stop Scanner
                </Button>
              </div>
            )}
            
            {isLoading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Processing barcode...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Scans or Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-100 text-blue-800 mt-0.5">1</Badge>
                <p><strong>Auto Detect:</strong> Automatically determines if you're adding a new item or using an existing one</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-green-100 text-green-800 mt-0.5">2</Badge>
                <p><strong>Add Stock:</strong> Adds quantity to existing items or creates new ones</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-red-100 text-red-800 mt-0.5">3</Badge>
                <p><strong>Use Item:</strong> Records usage and reduces inventory count</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Information Dialog */}
        <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogDescription>
                {productInfo?.found 
                  ? "Product information found! Please review and confirm."
                  : "No product information found. Please enter details manually."
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={productForm.name}
                  onChange={(e) => setProductForm(prev => ({...prev, name: e.target.value}))}
                  placeholder="Enter product name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={productForm.category} onValueChange={(value) => setProductForm(prev => ({...prev, category: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="unit_type">Unit Type</Label>
                  <Select value={productForm.unit_type} onValueChange={(value) => setProductForm(prev => ({...prev, unit_type: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {unitTypes.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={productForm.brand}
                    onChange={(e) => setProductForm(prev => ({...prev, brand: e.target.value}))}
                    placeholder="Brand name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    value={productForm.size}
                    onChange={(e) => setProductForm(prev => ({...prev, size: e.target.value}))}
                    placeholder="Size/quantity"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="current_stock">Initial Stock</Label>
                  <Input
                    id="current_stock"
                    type="number"
                    value={productForm.current_stock}
                    onChange={(e) => setProductForm(prev => ({...prev, current_stock: parseInt(e.target.value) || 0}))}
                    min="0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="min_stock_alert">Low Stock Alert</Label>
                  <Input
                    id="min_stock_alert"
                    type="number"
                    value={productForm.min_stock_alert}
                    onChange={(e) => setProductForm(prev => ({...prev, min_stock_alert: parseInt(e.target.value) || 5}))}
                    min="0"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowProductDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createNewItem} disabled={!productForm.name}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quantity Dialog */}
        <Dialog open={showQuantityDialog} onOpenChange={setShowQuantityDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Item Found</DialogTitle>
              <DialogDescription>
                {existingItem?.name} • Current stock: {existingItem?.current_stock} {existingItem?.unit_type}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => {
                  const qty = parseInt(prompt('How many units to add?') || '1');
                  addStockToItem(existingItem.id, qty);
                }}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Stock
              </Button>
              
              <Button
                onClick={() => {
                  const qty = parseInt(prompt('How many units used?') || '1');
                  useItem(existingItem.id, qty, scannedBarcode);
                }}
                variant="outline"
                className="flex-1"
              >
                <Minus className="h-4 w-4 mr-2" />
                Use Item
              </Button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowQuantityDialog(false)} className="w-full">
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BarcodeScanner;