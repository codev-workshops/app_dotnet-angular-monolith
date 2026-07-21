using Inventory.Api.Data;
using Inventory.Api.Models;
using Microsoft.EntityFrameworkCore;
using Shared.Contracts.Dtos;
using Shared.Contracts.Http;

namespace Inventory.Api.Services;

public class InventoryService
{
    private readonly InventoryDbContext _context;
    private readonly ProductsClient _products;

    public InventoryService(InventoryDbContext context, ProductsClient products)
    {
        _context = context;
        _products = products;
    }

    public async Task<List<InventoryDto>> GetAllInventoryAsync()
    {
        var items = await _context.InventoryItems.ToListAsync();
        return await ComposeAsync(items);
    }

    public async Task<InventoryDto?> GetInventoryByProductIdAsync(int productId)
    {
        var item = await _context.InventoryItems.FirstOrDefaultAsync(i => i.ProductId == productId);
        return item is null ? null : await ComposeOneAsync(item);
    }

    public async Task<List<InventoryDto>> GetLowStockItemsAsync()
    {
        var items = await _context.InventoryItems
            .Where(i => i.QuantityOnHand <= i.ReorderLevel)
            .ToListAsync();
        return await ComposeAsync(items);
    }

    // Base representation used by other services (product == null).
    public async Task<InventoryDto?> GetBaseInventoryByProductAsync(int productId)
    {
        var item = await _context.InventoryItems.FirstOrDefaultAsync(i => i.ProductId == productId);
        return item is null ? null : ToDto(item, product: null);
    }

    public async Task<InventoryDto> RestockAsync(int productId, int quantity)
    {
        var item = await _context.InventoryItems.FirstOrDefaultAsync(i => i.ProductId == productId)
            ?? throw new ArgumentException($"No inventory record for product {productId}");
        item.QuantityOnHand += quantity;
        item.LastRestocked = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return await ComposeOneAsync(item);
    }

    // Saga reserve: decrement stock. Returns false on insufficient stock,
    // null-signal (KeyNotFoundException) when no record exists.
    public async Task<bool> ReserveAsync(int productId, int quantity)
    {
        var item = await _context.InventoryItems.FirstOrDefaultAsync(i => i.ProductId == productId)
            ?? throw new KeyNotFoundException($"No inventory record for product {productId}");
        if (item.QuantityOnHand < quantity) return false;
        item.QuantityOnHand -= quantity;
        await _context.SaveChangesAsync();
        return true;
    }

    // Compensating action: return reserved stock.
    public async Task ReleaseAsync(int productId, int quantity)
    {
        var item = await _context.InventoryItems.FirstOrDefaultAsync(i => i.ProductId == productId)
            ?? throw new KeyNotFoundException($"No inventory record for product {productId}");
        item.QuantityOnHand += quantity;
        await _context.SaveChangesAsync();
    }

    private async Task<List<InventoryDto>> ComposeAsync(List<InventoryItem> items)
    {
        var result = new List<InventoryDto>(items.Count);
        foreach (var i in items)
            result.Add(await ComposeOneAsync(i));
        return result;
    }

    // Replaces EF `.Include(i => i.Product)` with an HTTP call to the Products
    // service. The fetched product already has inventory == null, orderItems == [].
    private async Task<InventoryDto> ComposeOneAsync(InventoryItem item)
    {
        var product = await _products.GetBaseProductAsync(item.ProductId);
        return ToDto(item, product);
    }

    private static InventoryDto ToDto(InventoryItem i, ProductDto? product) => new()
    {
        Id = i.Id,
        ProductId = i.ProductId,
        Product = product,
        QuantityOnHand = i.QuantityOnHand,
        ReorderLevel = i.ReorderLevel,
        WarehouseLocation = i.WarehouseLocation,
        LastRestocked = i.LastRestocked
    };
}
