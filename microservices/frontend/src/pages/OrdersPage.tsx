import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Alert, Spinner, Badge, Row, Col } from 'react-bootstrap';
import apiClient from '../api/client';
import { Order, Customer, Product, CreateOrderRequest } from '../types';

const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

interface OrderItemForm {
  productId: number;
  quantity: number;
}

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0);
  const [orderItems, setOrderItems] = useState<OrderItemForm[]>([{ productId: 0, quantity: 1 }]);
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await apiClient.get<Order[]>('/api/orders');
      setOrders(res.data);
    } catch {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [, customersRes, productsRes] = await Promise.all([
          fetchOrders(),
          apiClient.get<Customer[]>('/api/customers'),
          apiClient.get<Product[]>('/api/products'),
        ]);
        setCustomers(customersRes.data);
        setProducts(productsRes.data);
      } catch {
        setError('Failed to load data');
      }
    };
    fetchData();
  }, [fetchOrders]);

  const addItem = () => {
    setOrderItems((prev) => [...prev, { productId: 0, quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItemForm, value: number) => {
    setOrderItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleCreateOrder = async () => {
    setSubmitting(true);
    try {
      const payload: CreateOrderRequest = {
        customerId: selectedCustomerId,
        items: orderItems.filter((item) => item.productId > 0),
      };
      await apiClient.post('/api/orders', payload);
      setShowCreateModal(false);
      setSelectedCustomerId(0);
      setOrderItems([{ productId: 0, quantity: 1 }]);
      setLoading(true);
      await fetchOrders();
    } catch {
      setError('Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      await apiClient.put(`/api/orders/${orderId}/status`, { status });
      await fetchOrders();
    } catch {
      setError('Failed to update order status');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Pending: 'warning',
      Processing: 'info',
      Shipped: 'primary',
      Delivered: 'success',
      Cancelled: 'danger',
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Orders</h2>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          Create Order
        </Button>
      </div>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Status</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.customerName || o.customerId}</td>
              <td>{new Date(o.orderDate).toLocaleDateString()}</td>
              <td>{getStatusBadge(o.status)}</td>
              <td>${o.totalAmount.toFixed(2)}</td>
              <td>
                <Form.Select
                  size="sm"
                  value={o.status}
                  onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                  style={{ width: 'auto', display: 'inline-block' }}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Form.Select>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center">No orders found</td>
            </tr>
          )}
        </tbody>
      </Table>

      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Customer</Form.Label>
              <Form.Select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(parseInt(e.target.value))}
              >
                <option value={0}>Select a customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <h6>Order Items</h6>
            {orderItems.map((item, index) => (
              <Row key={index} className="mb-2 align-items-end">
                <Col md={6}>
                  <Form.Label>Product</Form.Label>
                  <Form.Select
                    value={item.productId}
                    onChange={(e) => updateItem(index, 'productId', parseInt(e.target.value))}
                  >
                    <option value={0}>Select a product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} (${p.price.toFixed(2)})</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </Col>
                <Col md={3}>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={orderItems.length === 1}
                  >
                    Remove
                  </Button>
                </Col>
              </Row>
            ))}
            <Button variant="outline-secondary" size="sm" onClick={addItem} className="mt-2">
              + Add Item
            </Button>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreateOrder} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Order'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default OrdersPage;
