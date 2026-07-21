namespace Shared.Contracts.Dtos;

// Mirrors OrderManager.Api.Models.Product serialized with ReferenceHandler.IgnoreCycles.
public class ProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Sku { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    // Populated on product reads (inventory.product == null); null when nested
    // inside an inventory or order-item response.
    public InventoryDto? Inventory { get; set; }

    // [] on inventory reads; [null] when nested inside an order item.
    public List<OrderItemDto?>? OrderItems { get; set; }
}
