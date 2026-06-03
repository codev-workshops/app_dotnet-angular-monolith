import { formatCurrency, formatDate } from '../format';

describe('formatCurrency', () => {
  it('formats 99.5 as $99.50', () => {
    expect(formatCurrency(99.5)).toBe('$99.50');
  });

  it('formats 0 as $0.00', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats 1234.56 as $1,234.56', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });
});

describe('formatDate', () => {
  it('formats an ISO date string containing Jan and 2024', () => {
    const result = formatDate('2024-01-15T00:00:00');
    expect(result).toContain('Jan');
    expect(result).toContain('2024');
  });
});
