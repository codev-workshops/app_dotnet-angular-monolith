import React from 'react';
import { render, screen } from '@testing-library/react';
import RootLayout from '../layout';

jest.mock('next/link', () => {
  return function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>;
  };
});

describe('RootLayout', () => {
  it('renders nav with 4 links to correct hrefs', () => {
    render(
      <RootLayout>
        <div>child content</div>
      </RootLayout>
    );
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/orders');
    expect(hrefs).toContain('/products');
    expect(hrefs).toContain('/customers');
    expect(hrefs).toContain('/inventory');
  });

  it('renders OrderManager heading', () => {
    render(
      <RootLayout>
        <div />
      </RootLayout>
    );
    expect(screen.getByText('OrderManager')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <RootLayout>
        <div data-testid="child">Hello</div>
      </RootLayout>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
