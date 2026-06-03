import React from 'react';
import { render, screen } from '@testing-library/react';
import DataTable from '../data-table';

interface TestRow {
  name: string;
  value: number;
}

const columns = [
  { header: 'Name', accessor: (r: TestRow) => r.name },
  { header: 'Value', accessor: (r: TestRow) => r.value },
];

describe('DataTable', () => {
  it('renders column headers correctly', () => {
    render(<DataTable columns={columns} rows={[{ name: 'A', value: 1 }]} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });

  it('renders rows with data', () => {
    render(
      <DataTable
        columns={columns}
        rows={[
          { name: 'Alpha', value: 10 },
          { name: 'Beta', value: 20 },
        ]}
      />
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('shows empty message when rows is empty', () => {
    render(<DataTable columns={columns} rows={[]} emptyMessage="Nothing here." />);
    expect(screen.getByText('Nothing here.')).toBeInTheDocument();
  });

  it('shows default empty message', () => {
    render(<DataTable columns={columns} rows={[]} />);
    expect(screen.getByText('No data available.')).toBeInTheDocument();
  });

  it('applies rowClassName to rows', () => {
    const { container } = render(
      <DataTable
        columns={columns}
        rows={[{ name: 'Low', value: 5 }]}
        rowClassName={(r) => (r.value < 10 ? 'warning' : undefined)}
      />
    );
    const row = container.querySelector('tbody tr');
    expect(row).toHaveClass('warning');
  });
});
