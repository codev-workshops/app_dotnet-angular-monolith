import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import apiClient from '../api/client';
import type { CreateProductRequest } from '../types';

interface Props {
  show: boolean;
  onHide: () => void;
  onCreated: () => void;
}

const CreateProductModal: React.FC<Props> = ({ show, onHide, onCreated }) => {
  const [form, setForm] = useState<CreateProductRequest>({
    name: '', description: '', category: '', price: 0, sku: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: keyof CreateProductRequest, value: string | number) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.sku) {
      setError('Name and SKU are required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await apiClient.post('/api/products', form);
      onCreated();
      onHide();
      setForm({ name: '', description: '', category: '', price: 0, sku: '' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create product';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Create Product</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form.Group className="mb-3">
          <Form.Label>Name</Form.Label>
          <Form.Control value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control as="textarea" rows={2} value={form.description} onChange={(e) => handleChange('description', e.target.value)} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Category</Form.Label>
          <Form.Control value={form.category} onChange={(e) => handleChange('category', e.target.value)} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Price</Form.Label>
          <Form.Control type="number" step="0.01" min="0" value={form.price} onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>SKU</Form.Label>
          <Form.Control value={form.sku} onChange={(e) => handleChange('sku', e.target.value)} />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Product'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateProductModal;
