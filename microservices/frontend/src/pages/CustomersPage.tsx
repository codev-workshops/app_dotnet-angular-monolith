import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import apiClient from '../api/client';
import { Customer, CreateCustomerRequest } from '../types';

const emptyForm: CreateCustomerRequest = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
};

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateCustomerRequest>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async () => {
    try {
      const res = await apiClient.get<Customer[]>('/api/customers');
      setCustomers(res.data);
    } catch {
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleChange = (field: keyof CreateCustomerRequest, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await apiClient.post('/api/customers', form);
      setShowModal(false);
      setForm(emptyForm);
      setLoading(true);
      await fetchCustomers();
    } catch {
      setError('Failed to create customer');
    } finally {
      setSubmitting(false);
    }
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
        <h2>Customers</h2>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          Add Customer
        </Button>
      </div>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>City</th>
            <th>State</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.name}</td>
              <td>{c.email}</td>
              <td>{c.phone}</td>
              <td>{c.city}</td>
              <td>{c.state}</td>
            </tr>
          ))}
          {customers.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center">No customers found</td>
            </tr>
          )}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control value={form.name} onChange={(e) => handleChange('name', e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control value={form.address} onChange={(e) => handleChange('address', e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>City</Form.Label>
              <Form.Control value={form.city} onChange={(e) => handleChange('city', e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>State</Form.Label>
              <Form.Control value={form.state} onChange={(e) => handleChange('state', e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Zip Code</Form.Label>
              <Form.Control value={form.zipCode} onChange={(e) => handleChange('zipCode', e.target.value)} required />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Customer'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default CustomersPage;
