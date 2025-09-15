"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listSallaOrders, updateSallaOrder } from "@/lib/api";

interface SallaOrdersProps {
  onMessage: (message: string) => void;
}

export default function SallaOrders({ onMessage }: SallaOrdersProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editOrderStatus, setEditOrderStatus] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      const res = await listSallaOrders(token, 1, 20);
      if (res.ok) setOrders(res.data || []);
    } catch {}
  };

  const handleUpdateOrder = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    setLoading(true);
    try {
      const payload: any = {};
      if (editOrderStatus) payload.status = editOrderStatus;
      
      const res = await updateSallaOrder(token, editingOrder.id, payload);
      onMessage(res.ok ? 'Order updated successfully' : (res.message || 'Failed to update order'));
      
      if (res.ok) {
        setEditingOrder(null);
        await loadOrders();
      }
    } catch (e) {
      onMessage('Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (order: any) => {
    setEditingOrder(order);
    const status = order.status || order.order_status || '';
    const statusValue = typeof status === 'object' ? (status.name || status.label || '') : status;
    setEditOrderStatus(String(statusValue || ''));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Orders ({orders.length})</h2>
            <Button size="sm" variant="outline" onClick={loadOrders} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-gray-600">No orders found.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div key={o.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">Order #{String(o.id)}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          Status: {typeof o.status === 'object' ? (o.status.name || o.status.label || JSON.stringify(o.status)) : String(o.status || o.order_status || 'N/A')}
                        </p>
                        {o.total && (
                          <p className="text-sm text-gray-600">
                            Total: {typeof o.total === 'object' ? (o.total.amount || o.total.value || 'N/A') : o.total}
                          </p>
                        )}
                        {o.customer && (
                          <p className="text-sm text-gray-600">
                            Customer: {typeof o.customer === 'object' ? (o.customer.name || o.customer.email || 'N/A') : o.customer}
                          </p>
                        )}
                        {o.created_at && (
                          <p className="text-sm text-gray-600">
                            Date: {new Date(o.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => startEdit(o)}>
                      Edit Status
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editingOrder && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Edit Order #{editingOrder.id}</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Order Status</label>
              <select 
                value={editOrderStatus} 
                onChange={e => setEditOrderStatus(e.target.value)} 
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateOrder} disabled={loading}>
                Update Order
              </Button>
              <Button variant="secondary" onClick={() => setEditingOrder(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
