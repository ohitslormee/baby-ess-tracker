import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Baby, Plus, Edit, Trash2, Calendar, Scale, Ruler, User } from 'lucide-react';
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

const ChildrenDetails = () => {
  const { colors } = useTheme();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const [childForm, setChildForm] = useState({
    name: '',
    date_of_birth: '',
    gender: '',
    height: '',
    weight: '',
    notes: ''
  });

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/children`);
      setChildren(response.data);
    } catch (error) {
      console.error('Error fetching children:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load children details');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
      months--;
      days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }
    
    if (months < 0) {
      years--;
      months += 12;
    }

    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''} ${days} day${days !== 1 ? 's' : ''}`;
    } else {
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  };

  const resetForm = () => {
    setChildForm({
      name: '',
      date_of_birth: '',
      gender: '',
      height: '',
      weight: '',
      notes: ''
    });
  };

  const handleAddChild = async () => {
    if (!childForm.name || !childForm.date_of_birth) {
      toast.error('Name and date of birth are required');
      return;
    }

    try {
      const response = await axios.post(`${API}/children`, childForm);
      toast.success(`Added ${response.data.name} successfully`);
      setShowAddDialog(false);
      resetForm();
      fetchChildren();
    } catch (error) {
      console.error('Error adding child:', error);
      toast.error(error.response?.data?.detail || 'Failed to add child');
    }
  };

  const handleEditChild = async () => {
    if (!editingChild) return;
    
    try {
      const response = await axios.put(`${API}/children/${editingChild.id}`, editingChild);
      toast.success('Child details updated successfully');
      setShowEditDialog(false);
      setEditingChild(null);
      fetchChildren();
    } catch (error) {
      console.error('Error updating child:', error);
      toast.error('Failed to update child details');
    }
  };

  const handleDeleteChild = async (childId, childName) => {
    if (!window.confirm(`Are you sure you want to delete ${childName}'s details?`)) {
      return;
    }

    try {
      await axios.delete(`${API}/children/${childId}`);
      toast.success(`Deleted ${childName}'s details`);
      fetchChildren();
    } catch (error) {
      console.error('Error deleting child:', error);
      toast.error('Failed to delete child details');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Child Details</h1>
              <p className="text-gray-600 text-lg">Manage your child's information and milestones</p>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              className={`${colors.button} text-white`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Child
            </Button>
          </div>
        </div>

        {children.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Baby className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No child added yet</h3>
              <p className="text-gray-600 mb-4">Start by adding your child's details to track their growth and milestones.</p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className={`${colors.button} text-white`}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Child
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => (
              <Card key={child.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Baby className={`h-5 w-5 ${colors.primaryText}`} />
                      {child.name}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingChild(child);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteChild(child.id, child.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {child.gender && (
                    <Badge className={colors.accent}>
                      <User className="h-3 w-3 mr-1" />
                      {child.gender}
                    </Badge>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Age</p>
                      <p className="text-sm text-gray-600">{calculateAge(child.date_of_birth)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Born</p>
                      <p className="text-sm text-gray-600">
                        {new Date(child.date_of_birth).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {child.height && (
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Height</p>
                        <p className="text-sm text-gray-600">{child.height} cm</p>
                      </div>
                    </div>
                  )}

                  {child.weight && (
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Weight</p>
                        <p className="text-sm text-gray-600">{child.weight} kg</p>
                      </div>
                    </div>
                  )}

                  {child.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{child.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Child Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Child</DialogTitle>
              <DialogDescription>Add your child's details to start tracking their growth.</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={childForm.name}
                  onChange={(e) => setChildForm(prev => ({...prev, name: e.target.value}))}
                  placeholder="Enter child's name"
                />
              </div>
              
              <div>
                <Label htmlFor="date_of_birth">Date of Birth *</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={childForm.date_of_birth}
                  onChange={(e) => setChildForm(prev => ({...prev, date_of_birth: e.target.value}))}
                />
              </div>
              
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={childForm.gender} onValueChange={(value) => setChildForm(prev => ({...prev, gender: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Boy">Boy</SelectItem>
                    <SelectItem value="Girl">Girl</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={childForm.height}
                    onChange={(e) => setChildForm(prev => ({...prev, height: e.target.value}))}
                    placeholder="Height"
                  />
                </div>
                
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={childForm.weight}
                    onChange={(e) => setChildForm(prev => ({...prev, weight: e.target.value}))}
                    placeholder="Weight"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={childForm.notes}
                  onChange={(e) => setChildForm(prev => ({...prev, notes: e.target.value}))}
                  placeholder="Additional notes (optional)"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddChild} className={`${colors.button} text-white`}>
                Add Child
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Child Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Child Details</DialogTitle>
              <DialogDescription>Update your child's information.</DialogDescription>
            </DialogHeader>
            
            {editingChild && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={editingChild.name}
                    onChange={(e) => setEditingChild(prev => ({...prev, name: e.target.value}))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-date_of_birth">Date of Birth *</Label>
                  <Input
                    id="edit-date_of_birth"
                    type="date"
                    value={editingChild.date_of_birth}
                    onChange={(e) => setEditingChild(prev => ({...prev, date_of_birth: e.target.value}))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-gender">Gender</Label>
                  <Select value={editingChild.gender || ''} onValueChange={(value) => setEditingChild(prev => ({...prev, gender: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Boy">Boy</SelectItem>
                      <SelectItem value="Girl">Girl</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-height">Height (cm)</Label>
                    <Input
                      id="edit-height"
                      type="number"
                      value={editingChild.height || ''}
                      onChange={(e) => setEditingChild(prev => ({...prev, height: e.target.value}))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-weight">Weight (kg)</Label>
                    <Input
                      id="edit-weight"
                      type="number"
                      step="0.1"
                      value={editingChild.weight || ''}
                      onChange={(e) => setEditingChild(prev => ({...prev, weight: e.target.value}))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Input
                    id="edit-notes"
                    value={editingChild.notes || ''}
                    onChange={(e) => setEditingChild(prev => ({...prev, notes: e.target.value}))}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditChild} className={`${colors.button} text-white`}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ChildrenDetails;