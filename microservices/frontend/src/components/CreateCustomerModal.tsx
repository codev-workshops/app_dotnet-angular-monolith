import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import apiClient from '../api/client';
import type { CreateCustomerRequest } from '../types';

interface Props {
  show: boolean;
  onHide: () => void;
  onCreated: () => void;
}

const CreateCustomerModal: React.FC<Props> = ({ show, onHide, onCreated }) => {
  const [form, setForm] = useState<CreateCustomerRequest>({
    name: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: keyof CreateCustomerRequest, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      setError('Name and email are required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await apiClient.post('/api/customers', form);
      onCreated();
      onHide();
      setForm({ name: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create customer';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Create Customer</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form.Group className="mb-3">
          <Form.Label>Name</Form.Label>
          <Form.Control value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Phone</Form.Label>
          <Form.Control value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Address</Form.Label>
          <Form.Control value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>City</Form.Label>
          <Form.Control value={form.city} onChange={(e) => handleChange('city', e.target.value)} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>State</Form.Label>
          <Form.Control value={form.state} onChange={(e) => handleChange('state', e.target.value)} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Zip Code</Form.Label>
          <Form.Control value={form.zipCode} onChange={(e) => handleChange('zipCode', e.target.value)} />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Customer'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateCustomerModal;
