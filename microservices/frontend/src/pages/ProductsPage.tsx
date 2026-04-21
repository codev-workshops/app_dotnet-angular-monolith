import React, { useEffect, useState } from 'react';
import { Table, Button, Spinner, Alert } from 'react-bootstrap';
import apiClient from '../api/client';
import type { Product } from '../types';
import CreateProductModal from '../components/CreateProductModal';

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchProducts = async () => {
    try {
      const { data } = await apiClient.get<Product[]>('/api/products');
      setProducts(data);
    } catch {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Products</h2>
        <Button variant="primary" onClick={() => setShowCreate(true)}>New Product</Button>
      </div>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr><td colSpan={5} className="text-center">No products found.</td></tr>
          ) : (
            products.map((p) => (
              <tr key={p.id}>
                <td>{p.sku}</td>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>${p.price.toFixed(2)}</td>
                <td>{p.inventory?.quantityOnHand ?? 'N/A'}</td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
      <CreateProductModal show={showCreate} onHide={() => setShowCreate(false)} onCreated={fetchProducts} />
    </>
  );
};

export default ProductsPage;
