import React, { useEffect, useState } from 'react';
import { Table, Button, Spinner, Alert } from 'react-bootstrap';
import apiClient from '../api/client';
import type { InventoryItem } from '../types';
import RestockModal from '../components/RestockModal';

const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);

  const fetchInventory = async () => {
    try {
      const { data } = await apiClient.get<InventoryItem[]>('/api/inventory');
      setItems(data);
    } catch {
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  if (loading) {
    return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  }

  return (
    <>
      <h2 className="mb-3">Inventory</h2>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Product</th>
            <th>On Hand</th>
            <th>Reorder Level</th>
            <th>Location</th>
            <th>Last Restocked</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={6} className="text-center">No inventory records.</td></tr>
          ) : (
            items.map((item) => (
              <tr
                key={item.id}
                className={item.quantityOnHand <= item.reorderLevel ? 'table-danger' : ''}
              >
                <td>{item.product?.name ?? `Product #${item.productId}`}</td>
                <td>{item.quantityOnHand}</td>
                <td>{item.reorderLevel}</td>
                <td>{item.warehouseLocation}</td>
                <td>{item.lastRestocked ? new Date(item.lastRestocked).toLocaleDateString() : 'N/A'}</td>
                <td>
                  <Button variant="outline-primary" size="sm" onClick={() => setRestockItem(item)}>
                    Restock
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
      <RestockModal
        show={!!restockItem}
        onHide={() => setRestockItem(null)}
        onRestocked={fetchInventory}
        productId={restockItem?.productId ?? null}
        productName={restockItem?.product?.name ?? ''}
      />
    </>
  );
};

export default InventoryPage;
