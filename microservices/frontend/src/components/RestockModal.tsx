import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import apiClient from '../api/client';

interface Props {
  show: boolean;
  onHide: () => void;
  onRestocked: () => void;
  productId: number | null;
  productName: string;
}

const RestockModal: React.FC<Props> = ({ show, onHide, onRestocked, productId, productName }) => {
  const [quantity, setQuantity] = useState<number>(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!productId || quantity < 1) {
      setError('Please enter a valid quantity');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await apiClient.post(`/api/inventory/product/${productId}/restock`, { quantity });
      onRestocked();
      onHide();
      setQuantity(0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to restock';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Restock: {productName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form.Group className="mb-3">
          <Form.Label>Quantity to Add</Form.Label>
          <Form.Control
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Restocking...' : 'Restock'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RestockModal;
