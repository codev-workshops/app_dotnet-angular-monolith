import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'OrderManager',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav>
          <h1>OrderManager</h1>
          <Link href="/orders">Orders</Link>
          <Link href="/products">Products</Link>
          <Link href="/customers">Customers</Link>
          <Link href="/inventory">Inventory</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
