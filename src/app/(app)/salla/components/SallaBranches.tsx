"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listSallaBranches, createSallaBranch, updateSallaBranch, deleteSallaBranch } from "@/lib/api";

interface SallaBranchesProps {
  onMessage: (message: string) => void;
}

export default function SallaBranches({ onMessage }: SallaBranchesProps) {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchAddress, setNewBranchAddress] = useState("");
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [editBranchName, setEditBranchName] = useState("");
  const [editBranchAddress, setEditBranchAddress] = useState("");

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      setLoading(true);
      const response = await listSallaBranches(token, 1, 50);
      if (response.ok && response.branches) {
        setBranches(response.branches);
      } else {
        onMessage(response.message || 'Failed to load branches');
      }
    } catch (error) {
      onMessage('Error loading branches');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    if (!token || !newBranchName.trim()) return;

    try {
      const response = await createSallaBranch(token, {
        name: newBranchName,
        address: newBranchAddress
      });
      
      if (response.ok) {
        onMessage('Branch created successfully');
        setNewBranchName("");
        setNewBranchAddress("");
        loadBranches();
      } else {
        onMessage(response.message || 'Failed to create branch');
      }
    } catch (error) {
      onMessage('Error creating branch');
    }
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    if (!token || !editingBranch) return;

    try {
      const response = await updateSallaBranch(token, editingBranch.id, {
        name: editBranchName,
        address: editBranchAddress
      });
      
      if (response.ok) {
        onMessage('Branch updated successfully');
        setEditingBranch(null);
        loadBranches();
      } else {
        onMessage(response.message || 'Failed to update branch');
      }
    } catch (error) {
      onMessage('Error updating branch');
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    if (!confirm('Are you sure you want to delete this branch?')) return;

    try {
      const response = await deleteSallaBranch(token, branchId);
      
      if (response.ok) {
        onMessage('Branch deleted successfully');
        loadBranches();
      } else {
        onMessage(response.message || 'Failed to delete branch');
      }
    } catch (error) {
      onMessage('Error deleting branch');
    }
  };

  const startEdit = (branch: any) => {
    setEditingBranch(branch);
    setEditBranchName(String(branch.name || ''));
    setEditBranchAddress(String(branch.address || ''));
  };

  return (
    <div className="space-y-6">
      {/* Create Branch Form */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Add New Branch</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateBranch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Branch Name</label>
              <input
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter branch name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <textarea
                value={newBranchAddress}
                onChange={(e) => setNewBranchAddress(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter branch address"
                rows={3}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Branch'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Branches List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Branches ({branches.length})</h2>
            <Button size="sm" variant="outline" onClick={loadBranches} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {branches.length === 0 ? (
            <p className="text-sm text-gray-600">No branches found. Click "Create Branch" to add your first branch.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {branches.map((branch) => (
                <div key={branch.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{String(branch.name || 'Unnamed')}</h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(branch)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteBranch(branch.id)} className="text-red-600">
                        Delete
                      </Button>
                    </div>
                  </div>
                  {branch.address && (
                    <p className="text-sm text-gray-600">{String(branch.address)}</p>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    ID: {String(branch.id || 'N/A')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Branch Modal */}
      {editingBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Branch</h3>
            <form onSubmit={handleUpdateBranch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Branch Name</label>
                <input
                  type="text"
                  value={editBranchName}
                  onChange={(e) => setEditBranchName(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  value={editBranchAddress}
                  onChange={(e) => setEditBranchAddress(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Branch'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingBranch(null)}>
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







