import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Alert } from 'react-bootstrap';
import apiClient from '../api/client';
import type { Customer, Product, CreateOrderRequest } from '../types';

interface Props {
  show: boolean;
  onHide: () => void;
  onCreated: () => void;
}

const CreateOrderModal: React.FC<Props> = ({ show, onHide, onCreated }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState<number>(0);
  const [items, setItems] = useState<{ productId: number; quantity: number }[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      Promise.all([
        apiClient.get<Customer[]>('/api/customers'),
        apiClient.get<Product[]>('/api/products'),
      ]).then(([custRes, prodRes]) => {
        setCustomers(custRes.data);
        setProducts(prodRes.data);
      });
      setCustomerId(0);
      setItems([]);
      setError('');
    }
  }, [show]);

  const addItem = () => {
    if (!selectedProduct || quantity < 1) return;
    const existing = items.find((i) => i.productId === selectedProduct);
    if (existing) {
      setItems(items.map((i) => (i.productId === selectedProduct ? { ...i, quantity: i.quantity + quantity } : i)));
    } else {
      setItems([...items, { productId: selectedProduct, quantity }]);
    }
    setQuantity(1);
  };

  const removeItem = (productId: number) => {
    setItems(items.filter((i) => i.productId !== productId));
  };

  const handleSubmit = async () => {
    if (!customerId) {
      setError('Please select a customer');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one item');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload: CreateOrderRequest = { customerId, items };
      await apiClient.post('/api/orders', payload);
      onCreated();
      onHide();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create order';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getProductName = (id: number) => products.find((p) => p.id === id)?.name ?? `Product #${id}`;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Create Order</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form.Group className="mb-3">
          <Form.Label>Customer</Form.Label>
          <Form.Select value={customerId} onChange={(e) => setCustomerId(Number(e.target.value))}>
            <option value={0}>Select a customer...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Label>Add Items</Form.Label>
        <div className="d-flex gap-2 mb-3">
          <Form.Select value={selectedProduct} onChange={(e) => setSelectedProduct(Number(e.target.value))} className="flex-grow-1">
            <option value={0}>Select a product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} (${p.price.toFixed(2)})</option>
            ))}
          </Form.Select>
          <Form.Control
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            style={{ width: '80px' }}
          />
          <Button variant="secondary" onClick={addItem}>Add</Button>
        </div>

        {items.length > 0 && (
          <Table size="sm" bordered>
            <thead>
              <tr><th>Product</th><th>Qty</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.productId}>
                  <td>{getProductName(item.productId)}</td>
                  <td>{item.quantity}</td>
                  <td>
                    <Button variant="outline-danger" size="sm" onClick={() => removeItem(item.productId)}>
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Order'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateOrderModal;
