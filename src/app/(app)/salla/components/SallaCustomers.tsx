"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listSallaCustomers, updateSallaCustomer } from "@/lib/api";

interface SallaCustomersProps {
  onMessage: (message: string) => void;
}

export default function SallaCustomers({ onMessage }: SallaCustomersProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editCustomerEmail, setEditCustomerEmail] = useState("");
  const [editCustomerPhone, setEditCustomerPhone] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      const res = await listSallaCustomers(token, 1, 20);
      if (res.ok) setCustomers(res.data || []);
    } catch {}
  };

  const handleUpdateCustomer = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    setLoading(true);
    try {
      const payload: any = {};
      if (editCustomerName) payload.name = editCustomerName;
      if (editCustomerEmail) payload.email = editCustomerEmail;
      if (editCustomerPhone) payload.phone = editCustomerPhone;
      
      const res = await updateSallaCustomer(token, editingCustomer.id, payload);
      onMessage(res.ok ? 'Customer updated successfully' : (res.message || 'Failed to update customer'));
      
      if (res.ok) {
        setEditingCustomer(null);
        await loadCustomers();
      }
    } catch (e) {
      onMessage('Failed to update customer');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (customer: any) => {
    setEditingCustomer(customer);
    setEditCustomerName(String(customer.name || customer.full_name || ''));
    setEditCustomerEmail(String(customer.email || ''));
    setEditCustomerPhone(String(customer.phone || customer.mobile || ''));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Customers ({customers.length})</h2>
            <Button size="sm" variant="outline" onClick={loadCustomers} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <p className="text-sm text-gray-600">No customers found.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {customers.map((c) => (
                <div key={c.id} className="p-4 border rounded-lg">
                  <p className="font-medium">{String(c.name || c.full_name || `Customer #${c.id}`)}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">Email: {String(c.email || 'N/A')}</p>
                    <p className="text-sm text-gray-600">Phone: {String(c.phone || c.mobile || 'N/A')}</p>
                    {c.orders_count && (
                      <p className="text-sm text-gray-600">Orders: {c.orders_count}</p>
                    )}
                    {c.total_spent && (
                      <p className="text-sm text-gray-600">
                        Total Spent: {typeof c.total_spent === 'object' ? (c.total_spent.amount || c.total_spent.value || 'N/A') : c.total_spent}
                      </p>
                    )}
                    {c.created_at && (
                      <p className="text-sm text-gray-600">
                        Joined: {new Date(c.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button size="sm" className="mt-3 w-full" onClick={() => startEdit(c)}>
                    Edit Customer
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editingCustomer && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Edit Customer: {String(editingCustomer.name || editingCustomer.id)}</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Customer Name</label>
              <input 
                value={editCustomerName} 
                onChange={e => setEditCustomerName(e.target.value)} 
                className="w-full border rounded px-3 py-2" 
                placeholder="Customer name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input 
                value={editCustomerEmail} 
                onChange={e => setEditCustomerEmail(e.target.value)} 
                className="w-full border rounded px-3 py-2" 
                placeholder="Email"
                type="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input 
                value={editCustomerPhone} 
                onChange={e => setEditCustomerPhone(e.target.value)} 
                className="w-full border rounded px-3 py-2" 
                placeholder="Phone number"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateCustomer} disabled={loading}>
                Update Customer
              </Button>
              <Button variant="secondary" onClick={() => setEditingCustomer(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
