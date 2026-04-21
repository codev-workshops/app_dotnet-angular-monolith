import React, { useEffect, useState } from 'react';
import { Table, Button, Spinner, Alert } from 'react-bootstrap';
import apiClient from '../api/client';
import type { Customer } from '../types';
import CreateCustomerModal from '../components/CreateCustomerModal';

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchCustomers = async () => {
    try {
      const { data } = await apiClient.get<Customer[]>('/api/customers');
      setCustomers(data);
    } catch {
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  if (loading) {
    return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Customers</h2>
        <Button variant="primary" onClick={() => setShowCreate(true)}>New Customer</Button>
      </div>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>City</th>
          </tr>
        </thead>
        <tbody>
          {customers.length === 0 ? (
            <tr><td colSpan={4} className="text-center">No customers found.</td></tr>
          ) : (
            customers.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
                <td>{c.city}, {c.state}</td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
      <CreateCustomerModal show={showCreate} onHide={() => setShowCreate(false)} onCreated={fetchCustomers} />
    </>
  );
};

export default CustomersPage;
