'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import DataTable from '@/components/data-table';
import type { Product } from '@/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchJson<Product[]>('/api/products').then(setProducts);
  }, []);

  return (
    <>
      <h2>Products</h2>
      <DataTable
        columns={[
          { header: 'SKU', accessor: (p) => p.sku },
          { header: 'Name', accessor: (p) => p.name },
          { header: 'Category', accessor: (p) => p.category },
          { header: 'Price', accessor: (p) => formatCurrency(p.price) },
          { header: 'Stock', accessor: (p) => p.inventory?.quantityOnHand ?? 'N/A' },
        ]}
        rows={products}
      />
    </>
  );
}
