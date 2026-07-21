using Microsoft.EntityFrameworkCore;
using Products.Api.Data;
using Products.Api.Models;
using Shared.Contracts.Dtos;
using Shared.Contracts.Http;

namespace Products.Api.Services;

public class ProductService
{
    private readonly ProductDbContext _context;
    private readonly InventoryClient _inventory;

    public ProductService(ProductDbContext context, InventoryClient inventory)
    {
        _context = context;
        _inventory = inventory;
    }

    public async Task<List<ProductDto>> GetAllProductsAsync()
    {
        var products = await _context.Products.ToListAsync();
        return await ComposeAsync(products);
    }

    public async Task<ProductDto?> GetProductByIdAsync(int id)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product is null) return null;
        return await ComposeOneAsync(product);
    }

    public async Task<List<ProductDto>> GetProductsByCategoryAsync(string category)
    {
        var products = await _context.Products.Where(p => p.Category == category).ToListAsync();
        return await ComposeAsync(products);
    }

    // Base representation used by other services (inventory == null, orderItems == []).
    public async Task<ProductDto?> GetBaseProductAsync(int id)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
        return product is null ? null : ToDto(product, inventory: null);
    }

    public async Task<ProductDto> CreateProductAsync(ProductDto input)
    {
        var product = new Product
        {
            Name = input.Name,
            Description = input.Description,
            Category = input.Category,
            Price = input.Price,
            Sku = input.Sku
        };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        return ToDto(product, inventory: null);
    }

    private async Task<List<ProductDto>> ComposeAsync(List<Product> products)
    {
        var result = new List<ProductDto>(products.Count);
        foreach (var p in products)
            result.Add(await ComposeOneAsync(p));
        return result;
    }

    // Replaces EF `.Include(p => p.Inventory)` with an HTTP call to the Inventory
    // service. The fetched inventory already has product == null.
    private async Task<ProductDto> ComposeOneAsync(Product product)
    {
        var inventory = await _inventory.GetBaseInventoryByProductAsync(product.Id);
        return ToDto(product, inventory);
    }

    private static ProductDto ToDto(Product p, InventoryDto? inventory) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Description = p.Description,
        Category = p.Category,
        Price = p.Price,
        Sku = p.Sku,
        CreatedAt = p.CreatedAt,
        Inventory = inventory,
        OrderItems = new List<OrderItemDto?>()
    };
}
