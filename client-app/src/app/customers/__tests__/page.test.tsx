import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CustomersPage from '../page';

jest.mock('@/lib/api', () => ({
  fetchJson: jest.fn(),
}));

import { fetchJson } from '@/lib/api';

const mockFetchJson = fetchJson as jest.MockedFunction<typeof fetchJson>;

describe('CustomersPage', () => {
  it('renders customer data', async () => {
    mockFetchJson.mockResolvedValue([
      {
        id: 1,
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '555-1234',
        city: 'Portland',
        state: 'OR',
      },
    ]);

    render(<CustomersPage />);

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('555-1234')).toBeInTheDocument();
  });

  it('formats city as "city, state"', async () => {
    mockFetchJson.mockResolvedValue([
      {
        id: 1,
        name: 'Bob',
        email: 'bob@test.com',
        phone: '555-0000',
        city: 'Seattle',
        state: 'WA',
      },
    ]);

    render(<CustomersPage />);

    await waitFor(() => {
      expect(screen.getByText('Seattle, WA')).toBeInTheDocument();
    });
  });
});
