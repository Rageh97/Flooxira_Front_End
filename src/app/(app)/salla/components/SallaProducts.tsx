"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listSallaProducts, createSallaProduct, updateSallaProduct } from "@/lib/api";

interface SallaProductsProps {
  onMessage: (message: string) => void;
}

export default function SallaProducts({ onMessage }: SallaProductsProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editProductName, setEditProductName] = useState("");
  const [editProductPrice, setEditProductPrice] = useState("");
  const [editProductDescription, setEditProductDescription] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      const res = await listSallaProducts(token, 1, 20);
      if (res.ok) setProducts(res.data || []);
    } catch {}
  };

  const handleCreateProduct = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    setLoading(true);
    try {
      const payload: any = { name: newProductName };
      if (newProductPrice) payload.price = Number(newProductPrice);
      const res = await createSallaProduct(token, payload);
      onMessage(res.ok ? 'Product created' : (res.message || 'Failed to create product'));
      if (res.ok) {
        setNewProductName("");
        setNewProductPrice("");
        await loadProducts();
      }
    } catch (e) {
      onMessage('Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    setLoading(true);
    try {
      const payload: any = {};
      if (editProductName) payload.name = editProductName;
      if (editProductPrice) payload.price = Number(editProductPrice);
      if (editProductDescription) payload.description = editProductDescription;
      
      const res = await updateSallaProduct(token, editingProduct.id, payload);
      onMessage(res.ok ? 'Product updated successfully' : (res.message || 'Failed to update product'));
      
      if (res.ok) {
        setEditingProduct(null);
        await loadProducts();
      }
    } catch (e) {
      onMessage('Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (product: any) => {
    setEditingProduct(product);
    setEditProductName(String(product.name || ''));
    const price = product.price || product.sale_price || product.regular_price || '';
    const priceValue = typeof price === 'object' ? (price.amount || price.value || '') : price;
    setEditProductPrice(String(priceValue || ''));
    setEditProductDescription(String(product.description || ''));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Add New Product</h2>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <input 
              value={newProductName} 
              onChange={e => setNewProductName(e.target.value)} 
              placeholder="Product name" 
              className="border rounded px-3 py-2 flex-1" 
            />
            <input 
              value={newProductPrice} 
              onChange={e => setNewProductPrice(e.target.value)} 
              placeholder="Price" 
              type="number"
              step="0.01"
              className="border rounded px-3 py-2 w-32" 
            />
            <Button onClick={handleCreateProduct} disabled={loading || !newProductName}>
              Add Product
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Products ({products.length})</h2>
            <Button size="sm" variant="outline" onClick={loadProducts} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-sm text-gray-600">No products found. Click "Add Product" to create your first product.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <div key={p.id} className="p-4 border rounded-lg">
                  <p className="font-medium truncate">{String(p.name || p.title || `#${p.id}`)}</p>
                  {p.thumbnail && (
                    <img src={String(p.thumbnail)} alt={String(p.name || 'Product')} className="mt-2 h-32 w-full object-cover rounded" />
                  )}
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">SKU: {String(p.sku || 'N/A')}</p>
                    <p className="text-sm text-gray-600">Type: {String(p.type || 'N/A')}</p>
                    {p.price && (
                      <p className="text-sm text-gray-600">
                        Price: {typeof p.price === 'object' ? (p.price.amount || p.price.value || 'N/A') : p.price}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => startEdit(p)} className="flex-1">
                      Edit
                    </Button>
                    <Button size="sm" variant="secondary" onClick={async () => {
                      const token = localStorage.getItem('auth_token');
                      if (!token) return;
                      const res = await updateSallaProduct(token, p.id, { name: String(p.name || 'Product') + ' (Updated)' });
                      onMessage(res.ok ? 'Product updated' : (res.message || 'Failed to update product'));
                      if (res.ok) await loadProducts();
                    }}>
                      Quick Update
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editingProduct && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Edit Product: {String(editingProduct.name || editingProduct.id)}</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product Name</label>
              <input 
                value={editProductName} 
                onChange={e => setEditProductName(e.target.value)} 
                className="w-full border rounded px-3 py-2" 
                placeholder="Product name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <input 
                value={editProductPrice} 
                onChange={e => setEditProductPrice(e.target.value)} 
                className="w-full border rounded px-3 py-2" 
                placeholder="Price"
                type="number"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea 
                value={editProductDescription} 
                onChange={e => setEditProductDescription(e.target.value)} 
                className="w-full border rounded px-3 py-2" 
                placeholder="Product description"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateProduct} disabled={loading}>
                Save Changes
              </Button>
              <Button variant="secondary" onClick={() => setEditingProduct(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
