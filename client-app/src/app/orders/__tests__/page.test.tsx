import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import OrdersPage from '../page';

jest.mock('@/lib/api', () => ({
  fetchJson: jest.fn(),
}));

import { fetchJson } from '@/lib/api';

const mockFetchJson = fetchJson as jest.MockedFunction<typeof fetchJson>;

describe('OrdersPage', () => {
  it('renders table with order data', async () => {
    mockFetchJson.mockResolvedValue([
      {
        id: 1,
        customer: { name: 'John Doe' },
        orderDate: '2024-03-15T00:00:00',
        status: 'Shipped',
        totalAmount: 150.0,
      },
    ]);

    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    expect(screen.getByText('Shipped')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
  });

  it('shows empty message when API returns empty array', async () => {
    mockFetchJson.mockResolvedValue([]);

    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('No orders yet.')).toBeInTheDocument();
    });
  });
});
