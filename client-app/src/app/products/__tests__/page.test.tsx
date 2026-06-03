import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ProductsPage from '../page';

jest.mock('@/lib/api', () => ({
  fetchJson: jest.fn(),
}));

import { fetchJson } from '@/lib/api';

const mockFetchJson = fetchJson as jest.MockedFunction<typeof fetchJson>;

describe('ProductsPage', () => {
  it('renders product data with correct columns', async () => {
    mockFetchJson.mockResolvedValue([
      {
        id: 1,
        sku: 'SKU-001',
        name: 'Widget',
        category: 'Parts',
        price: 29.99,
        inventory: { quantityOnHand: 100 },
      },
    ]);

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByText('Widget')).toBeInTheDocument();
    });
    expect(screen.getByText('SKU-001')).toBeInTheDocument();
    expect(screen.getByText('Parts')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('shows N/A when product has null inventory', async () => {
    mockFetchJson.mockResolvedValue([
      {
        id: 2,
        sku: 'SKU-002',
        name: 'Gadget',
        category: 'Electronics',
        price: 49.99,
        inventory: null,
      },
    ]);

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });
});
