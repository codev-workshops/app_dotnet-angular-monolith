import { useState, useEffect } from 'react';
import { Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import apiClient from '../api/client';
import { Customer, Product, Order, InventoryItem } from '../types';

function DashboardPage() {
  const [customerCount, setCustomerCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, productsRes, ordersRes, lowStockRes] = await Promise.all([
          apiClient.get<Customer[]>('/api/customers'),
          apiClient.get<Product[]>('/api/products'),
          apiClient.get<Order[]>('/api/orders'),
          apiClient.get<InventoryItem[]>('/api/inventory/low-stock'),
        ]);
        setCustomerCount(customersRes.data.length);
        setProductCount(productsRes.data.length);
        setOrderCount(ordersRes.data.length);
        setLowStockCount(lowStockRes.data.length);
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <>
      <h2 className="mb-4">Dashboard</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Row>
        <Col md={3}>
          <Card bg="primary" text="white" className="mb-4">
            <Card.Body>
              <Card.Title>Total Customers</Card.Title>
              <Card.Text className="display-4">{customerCount}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card bg="success" text="white" className="mb-4">
            <Card.Body>
              <Card.Title>Total Products</Card.Title>
              <Card.Text className="display-4">{productCount}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card bg="info" text="white" className="mb-4">
            <Card.Body>
              <Card.Title>Total Orders</Card.Title>
              <Card.Text className="display-4">{orderCount}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card bg="warning" text="dark" className="mb-4">
            <Card.Body>
              <Card.Title>Low Stock Items</Card.Title>
              <Card.Text className="display-4">{lowStockCount}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}

export default DashboardPage;
