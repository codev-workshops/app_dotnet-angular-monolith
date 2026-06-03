import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import InventoryPage from '../page';

jest.mock('@/lib/api', () => ({
  fetchJson: jest.fn(),
}));

import { fetchJson } from '@/lib/api';

const mockFetchJson = fetchJson as jest.MockedFunction<typeof fetchJson>;

describe('InventoryPage', () => {
  it('renders inventory data', async () => {
    mockFetchJson.mockResolvedValue([
      {
        id: 1,
        product: { name: 'Widget' },
        quantityOnHand: 50,
        reorderLevel: 10,
        warehouseLocation: 'A1',
        lastRestocked: '2024-06-01T00:00:00',
      },
    ]);

    render(<InventoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Widget')).toBeInTheDocument();
    });
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('A1')).toBeInTheDocument();
  });

  it('applies .low-stock class when quantityOnHand <= reorderLevel', async () => {
    mockFetchJson.mockResolvedValue([
      {
        id: 1,
        product: { name: 'LowItem' },
        quantityOnHand: 5,
        reorderLevel: 10,
        warehouseLocation: 'B2',
        lastRestocked: '2024-01-01T00:00:00',
      },
    ]);

    const { container } = render(<InventoryPage />);

    await waitFor(() => {
      expect(screen.getByText('LowItem')).toBeInTheDocument();
    });
    const row = container.querySelector('tbody tr');
    expect(row).toHaveClass('low-stock');
  });

  it('does NOT apply .low-stock class when quantityOnHand > reorderLevel', async () => {
    mockFetchJson.mockResolvedValue([
      {
        id: 2,
        product: { name: 'OkItem' },
        quantityOnHand: 100,
        reorderLevel: 10,
        warehouseLocation: 'C3',
        lastRestocked: '2024-05-01T00:00:00',
      },
    ]);

    const { container } = render(<InventoryPage />);

    await waitFor(() => {
      expect(screen.getByText('OkItem')).toBeInTheDocument();
    });
    const row = container.querySelector('tbody tr');
    expect(row).not.toHaveClass('low-stock');
  });
});
