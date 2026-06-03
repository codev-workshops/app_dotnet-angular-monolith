'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '@/lib/api';
import { formatDate } from '@/lib/format';
import DataTable from '@/components/data-table';
import type { InventoryItem } from '@/types';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    fetchJson<InventoryItem[]>('/api/inventory').then(setItems);
  }, []);

  return (
    <>
      <h2>Inventory</h2>
      <DataTable
        columns={[
          { header: 'Product', accessor: (i) => i.product?.name },
          { header: 'On Hand', accessor: (i) => i.quantityOnHand },
          { header: 'Reorder Level', accessor: (i) => i.reorderLevel },
          { header: 'Location', accessor: (i) => i.warehouseLocation },
          { header: 'Last Restocked', accessor: (i) => formatDate(i.lastRestocked) },
        ]}
        rows={items}
        rowClassName={(item) =>
          item.quantityOnHand <= item.reorderLevel ? 'low-stock' : undefined
        }
      />
    </>
  );
}
