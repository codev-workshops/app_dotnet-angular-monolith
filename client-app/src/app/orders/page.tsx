'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import DataTable from '@/components/data-table';
import type { Order } from '@/types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchJson<Order[]>('/api/orders').then(setOrders);
  }, []);

  return (
    <>
      <h2>Orders</h2>
      <DataTable
        columns={[
          { header: 'ID', accessor: (o) => o.id },
          { header: 'Customer', accessor: (o) => o.customer?.name },
          { header: 'Date', accessor: (o) => formatDate(o.orderDate) },
          { header: 'Status', accessor: (o) => o.status },
          { header: 'Total', accessor: (o) => formatCurrency(o.totalAmount) },
        ]}
        rows={orders}
        emptyMessage="No orders yet."
      />
    </>
  );
}
