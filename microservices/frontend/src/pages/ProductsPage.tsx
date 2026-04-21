import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import apiClient from '../api/client';
import { Product, CreateProductRequest } from '../types';

const emptyForm: CreateProductRequest = {
  name: '',
  description: '',
  category: '',
  price: 0,
  sku: '',
};

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateProductRequest>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await apiClient.get<Product[]>('/api/products');
      setProducts(res.data);
    } catch {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (field: keyof CreateProductRequest, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await apiClient.post('/api/products', form);
      setShowModal(false);
      setForm(emptyForm);
      setLoading(true);
      await fetchProducts();
    } catch {
      setError('Failed to create product');
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
        <h2>Products</h2>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          Add Product
        </Button>
      </div>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.sku}</td>
              <td>{p.name}</td>
              <td>{p.category}</td>
              <td>${p.price.toFixed(2)}</td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center">No products found</td>
            </tr>
          )}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control value={form.name} onChange={(e) => handleChange('name', e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} value={form.description} onChange={(e) => handleChange('description', e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Control value={form.category} onChange={(e) => handleChange('category', e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Price</Form.Label>
              <Form.Control type="number" step="0.01" value={form.price} onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>SKU</Form.Label>
              <Form.Control value={form.sku} onChange={(e) => handleChange('sku', e.target.value)} required />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Product'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ProductsPage;
