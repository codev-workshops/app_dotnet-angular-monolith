'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '@/lib/api';
import DataTable from '@/components/data-table';
import type { Customer } from '@/types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    fetchJson<Customer[]>('/api/customers').then(setCustomers);
  }, []);

  return (
    <>
      <h2>Customers</h2>
      <DataTable
        columns={[
          { header: 'Name', accessor: (c) => c.name },
          { header: 'Email', accessor: (c) => c.email },
          { header: 'Phone', accessor: (c) => c.phone },
          { header: 'City', accessor: (c) => `${c.city}, ${c.state}` },
        ]}
        rows={customers}
      />
    </>
  );
}
