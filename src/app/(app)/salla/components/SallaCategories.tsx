"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listSallaCategories, createSallaCategory, updateSallaCategory, deleteSallaCategory } from "@/lib/api";

interface SallaCategoriesProps {
  onMessage: (message: string) => void;
}

export default function SallaCategories({ onMessage }: SallaCategoriesProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryDescription, setEditCategoryDescription] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      setLoading(true);
      const response = await listSallaCategories(token, 1, 50);
      if (response.ok && response.categories) {
        setCategories(response.categories);
      } else {
        onMessage(response.message || 'Failed to load categories');
      }
    } catch (error) {
      onMessage('Error loading categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    if (!token || !newCategoryName.trim()) return;

    try {
      const response = await createSallaCategory(token, {
        name: newCategoryName,
        description: newCategoryDescription
      });
      
      if (response.ok) {
        onMessage('Category created successfully');
        setNewCategoryName("");
        setNewCategoryDescription("");
        loadCategories();
      } else {
        onMessage(response.message || 'Failed to create category');
      }
    } catch (error) {
      onMessage('Error creating category');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    if (!token || !editingCategory) return;

    try {
      const response = await updateSallaCategory(token, editingCategory.id, {
        name: editCategoryName,
        description: editCategoryDescription
      });
      
      if (response.ok) {
        onMessage('Category updated successfully');
        setEditingCategory(null);
        loadCategories();
      } else {
        onMessage(response.message || 'Failed to update category');
      }
    } catch (error) {
      onMessage('Error updating category');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const response = await deleteSallaCategory(token, categoryId);
      
      if (response.ok) {
        onMessage('Category deleted successfully');
        loadCategories();
      } else {
        onMessage(response.message || 'Failed to delete category');
      }
    } catch (error) {
      onMessage('Error deleting category');
    }
  };

  const startEdit = (category: any) => {
    setEditingCategory(category);
    setEditCategoryName(String(category.name || ''));
    setEditCategoryDescription(String(category.description || ''));
  };

  return (
    <div className="space-y-6">
      {/* Create Category Form */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Add New Category</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category Name</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter category name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter category description"
                rows={3}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Category'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Categories ({categories.length})</h2>
            <Button size="sm" variant="outline" onClick={loadCategories} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-gray-600">No categories found. Click "Create Category" to add your first category.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <div key={category.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{String(category.name || 'Unnamed')}</h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(category)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteCategory(category.id)} className="text-red-600">
                        Delete
                      </Button>
                    </div>
                  </div>
                  {category.description && (
                    <p className="text-sm text-gray-600">{String(category.description)}</p>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    ID: {String(category.id || 'N/A')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Category</h3>
            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category Name</label>
                <input
                  type="text"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editCategoryDescription}
                  onChange={(e) => setEditCategoryDescription(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Category'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>
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











