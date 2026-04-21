import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import apiClient from '../api/client';

interface DashboardStats {
  totalCustomers: number;
  totalProducts: number;
  totalOrders: number;
  lowStockCount: number;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalProducts: 0,
    totalOrders: 0,
    lowStockCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [customersRes, productsRes, ordersRes, lowStockRes] = await Promise.all([
          apiClient.get('/api/customers'),
          apiClient.get('/api/products'),
          apiClient.get('/api/orders'),
          apiClient.get('/api/inventory/low-stock'),
        ]);
        setStats({
          totalCustomers: Array.isArray(customersRes.data) ? customersRes.data.length : 0,
          totalProducts: Array.isArray(productsRes.data) ? productsRes.data.length : 0,
          totalOrders: Array.isArray(ordersRes.data) ? ordersRes.data.length : 0,
          lowStockCount: Array.isArray(lowStockRes.data) ? lowStockRes.data.length : 0,
        });
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  }

  if (error) {
    return <Alert variant="danger" className="mt-3">{error}</Alert>;
  }

  const cards = [
    { title: 'Customers', value: stats.totalCustomers, bg: 'primary' },
    { title: 'Products', value: stats.totalProducts, bg: 'success' },
    { title: 'Orders', value: stats.totalOrders, bg: 'info' },
    { title: 'Low Stock Items', value: stats.lowStockCount, bg: 'warning' },
  ];

  return (
    <>
      <h2 className="mb-4">Dashboard</h2>
      <Row>
        {cards.map((card) => (
          <Col key={card.title} sm={6} lg={3} className="mb-3">
            <Card bg={card.bg} text={card.bg === 'warning' ? 'dark' : 'white'}>
              <Card.Body>
                <Card.Title>{card.title}</Card.Title>
                <h1>{card.value}</h1>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
};

export default DashboardPage;
