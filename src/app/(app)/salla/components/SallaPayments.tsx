"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listSallaPayments, updateSallaPayment } from "@/lib/api";

interface SallaPaymentsProps {
  onMessage: (message: string) => void;
}

export default function SallaPayments({ onMessage }: SallaPaymentsProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [editPaymentStatus, setEditPaymentStatus] = useState("");

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      setLoading(true);
      const response = await listSallaPayments(token, 1, 50);
      if (response.ok && response.payments) {
        setPayments(response.payments);
      } else {
        onMessage(response.message || 'Failed to load payments');
      }
    } catch (error) {
      onMessage('Error loading payments');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    if (!token || !editingPayment) return;

    try {
      const response = await updateSallaPayment(token, editingPayment.id, {
        status: editPaymentStatus
      });
      
      if (response.ok) {
        onMessage('Payment updated successfully');
        setEditingPayment(null);
        loadPayments();
      } else {
        onMessage(response.message || 'Failed to update payment');
      }
    } catch (error) {
      onMessage('Error updating payment');
    }
  };

  const startEdit = (payment: any) => {
    setEditingPayment(payment);
    const statusValue = payment.status?.name || payment.status?.label || payment.status || '';
    setEditPaymentStatus(String(statusValue));
  };

  return (
    <div className="space-y-6">
      {/* Payments List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Payments ({payments.length})</h2>
            <Button size="sm" variant="outline" onClick={loadPayments} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-gray-600">No payments found.</p>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-medium">Payment #{String(payment.id || 'N/A')}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          payment.status?.name === 'completed' || payment.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : payment.status?.name === 'pending' || payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {String(payment.status?.name || payment.status?.label || payment.status || 'Unknown')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Amount:</span> {String(payment.amount || payment.total || 'N/A')}
                        </div>
                        <div>
                          <span className="font-medium">Method:</span> {String(payment.method || payment.payment_method || 'N/A')}
                        </div>
                        <div>
                          <span className="font-medium">Order ID:</span> {String(payment.order_id || 'N/A')}
                        </div>
                        <div>
                          <span className="font-medium">Created:</span> {String(payment.created_at || payment.created || 'N/A')}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => startEdit(payment)}>
                      Update Status
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Payment Modal */}
      {editingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Update Payment Status</h3>
            <form onSubmit={handleUpdatePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Payment ID</label>
                <input
                  type="text"
                  value={String(editingPayment.id || '')}
                  className="w-full p-2 border rounded-md bg-gray-100"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={editPaymentStatus}
                  onChange={(e) => setEditPaymentStatus(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Payment'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingPayment(null)}>
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







