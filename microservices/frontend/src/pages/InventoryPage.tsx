import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import apiClient from '../api/client';
import { InventoryItem } from '../types';

function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockProductId, setRestockProductId] = useState<number>(0);
  const [restockProductName, setRestockProductName] = useState('');
  const [restockQuantity, setRestockQuantity] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await apiClient.get<InventoryItem[]>('/api/inventory');
      setInventory(res.data);
    } catch {
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const openRestockModal = (item: InventoryItem) => {
    setRestockProductId(item.productId);
    setRestockProductName(item.product?.name || item.productName || item.product?.sku || item.sku || '');
    setRestockQuantity(0);
    setShowRestockModal(true);
  };

  const handleRestock = async () => {
    setSubmitting(true);
    try {
      await apiClient.post(`/api/inventory/product/${restockProductId}/restock`, {
        quantity: restockQuantity,
      });
      setShowRestockModal(false);
      setLoading(true);
      await fetchInventory();
    } catch {
      setError('Failed to restock item');
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
      <h2 className="mb-4">Inventory</h2>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Qty On Hand</th>
            <th>Reorder Level</th>
            <th>Warehouse</th>
            <th>Last Restocked</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item) => {
            const isLowStock = item.quantityOnHand <= item.reorderLevel;
            return (
              <tr key={item.id} className={isLowStock ? 'table-danger' : ''}>
                <td>{item.product?.name || item.productName || '-'}</td>
                <td>{item.product?.sku || item.sku || '-'}</td>
                <td>{item.quantityOnHand}</td>
                <td>{item.reorderLevel}</td>
                <td>{item.warehouseLocation}</td>
                <td>{item.lastRestocked ? new Date(item.lastRestocked).toLocaleDateString() : '-'}</td>
                <td>
                  <Button variant="warning" size="sm" onClick={() => openRestockModal(item)}>
                    Restock
                  </Button>
                </td>
              </tr>
            );
          })}
          {inventory.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center">No inventory items found</td>
            </tr>
          )}
        </tbody>
      </Table>

      <Modal show={showRestockModal} onHide={() => setShowRestockModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Restock: {restockProductName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Quantity to Add</Form.Label>
              <Form.Control
                type="number"
                min={1}
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 0)}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRestockModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleRestock} disabled={submitting || restockQuantity <= 0}>
            {submitting ? 'Restocking...' : 'Restock'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default InventoryPage;
