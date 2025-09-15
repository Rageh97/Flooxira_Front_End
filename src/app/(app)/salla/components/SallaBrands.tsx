"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listSallaBrands, createSallaBrand, updateSallaBrand, deleteSallaBrand } from "@/lib/api";

interface SallaBrandsProps {
  onMessage: (message: string) => void;
}

export default function SallaBrands({ onMessage }: SallaBrandsProps) {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandDescription, setNewBrandDescription] = useState("");
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [editBrandName, setEditBrandName] = useState("");
  const [editBrandDescription, setEditBrandDescription] = useState("");

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      setLoading(true);
      const response = await listSallaBrands(token, 1, 50);
      if (response.ok && response.brands) {
        setBrands(response.brands);
      } else {
        onMessage(response.message || 'Failed to load brands');
      }
    } catch (error) {
      onMessage('Error loading brands');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    if (!token || !newBrandName.trim()) return;

    try {
      const response = await createSallaBrand(token, {
        name: newBrandName,
        description: newBrandDescription
      });
      
      if (response.ok) {
        onMessage('Brand created successfully');
        setNewBrandName("");
        setNewBrandDescription("");
        loadBrands();
      } else {
        onMessage(response.message || 'Failed to create brand');
      }
    } catch (error) {
      onMessage('Error creating brand');
    }
  };

  const handleUpdateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    if (!token || !editingBrand) return;

    try {
      const response = await updateSallaBrand(token, editingBrand.id, {
        name: editBrandName,
        description: editBrandDescription
      });
      
      if (response.ok) {
        onMessage('Brand updated successfully');
        setEditingBrand(null);
        loadBrands();
      } else {
        onMessage(response.message || 'Failed to update brand');
      }
    } catch (error) {
      onMessage('Error updating brand');
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    if (!confirm('Are you sure you want to delete this brand?')) return;

    try {
      const response = await deleteSallaBrand(token, brandId);
      
      if (response.ok) {
        onMessage('Brand deleted successfully');
        loadBrands();
      } else {
        onMessage(response.message || 'Failed to delete brand');
      }
    } catch (error) {
      onMessage('Error deleting brand');
    }
  };

  const startEdit = (brand: any) => {
    setEditingBrand(brand);
    setEditBrandName(String(brand.name || ''));
    setEditBrandDescription(String(brand.description || ''));
  };

  return (
    <div className="space-y-6">
      {/* Create Brand Form */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Add New Brand</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateBrand} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Brand Name</label>
              <input
                type="text"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter brand name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={newBrandDescription}
                onChange={(e) => setNewBrandDescription(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter brand description"
                rows={3}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Brand'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Brands List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Brands ({brands.length})</h2>
            <Button size="sm" variant="outline" onClick={loadBrands} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {brands.length === 0 ? (
            <p className="text-sm text-gray-600">No brands found. Click "Create Brand" to add your first brand.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {brands.map((brand) => (
                <div key={brand.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{String(brand.name || 'Unnamed')}</h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(brand)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteBrand(brand.id)} className="text-red-600">
                        Delete
                      </Button>
                    </div>
                  </div>
                  {brand.description && (
                    <p className="text-sm text-gray-600">{String(brand.description)}</p>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    ID: {String(brand.id || 'N/A')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Brand Modal */}
      {editingBrand && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Brand</h3>
            <form onSubmit={handleUpdateBrand} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Brand Name</label>
                <input
                  type="text"
                  value={editBrandName}
                  onChange={(e) => setEditBrandName(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editBrandDescription}
                  onChange={(e) => setEditBrandDescription(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Brand'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingBrand(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}







