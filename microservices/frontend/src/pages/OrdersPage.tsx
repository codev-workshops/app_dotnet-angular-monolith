import React, { useEffect, useState } from 'react';
import { Table, Button, Spinner, Alert, Form } from 'react-bootstrap';
import apiClient from '../api/client';
import type { Order } from '../types';
import CreateOrderModal from '../components/CreateOrderModal';

const STATUS_OPTIONS = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchOrders = async () => {
    try {
      const { data } = await apiClient.get<Order[]>('/api/orders');
      setOrders(data);
    } catch {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId: number, status: string) => {
    try {
      await apiClient.put(`/api/orders/${orderId}/status`, { status });
      fetchOrders();
    } catch {
      setError('Failed to update order status');
    }
  };

  if (loading) {
    return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Orders</h2>
        <Button variant="primary" onClick={() => setShowCreate(true)}>New Order</Button>
      </div>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Status</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr><td colSpan={5} className="text-center">No orders yet.</td></tr>
          ) : (
            orders.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.customer?.name ?? `Customer #${o.customerId}`}</td>
                <td>{new Date(o.orderDate).toLocaleDateString()}</td>
                <td>
                  <Form.Select
                    size="sm"
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    style={{ width: '140px' }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Form.Select>
                </td>
                <td>${o.totalAmount.toFixed(2)}</td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
      <CreateOrderModal show={showCreate} onHide={() => setShowCreate(false)} onCreated={fetchOrders} />
    </>
  );
};

export default OrdersPage;
