import { fetchJson } from '../api';

describe('fetchJson', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('calls fetch with correct URL and returns parsed JSON', async () => {
    const mockData = [{ id: 1 }];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await fetchJson('/api/orders');
    expect(global.fetch).toHaveBeenCalledWith('/api/orders');
    expect(result).toEqual(mockData);
  });

  it('throws on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(fetchJson('/api/missing')).rejects.toThrow('API error: 404 Not Found');
  });
});
