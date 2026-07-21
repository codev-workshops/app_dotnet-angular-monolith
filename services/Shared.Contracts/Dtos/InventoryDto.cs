namespace Shared.Contracts.Dtos;

// Mirrors OrderManager.Api.Models.InventoryItem serialized with ReferenceHandler.IgnoreCycles.
public class InventoryDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }

    // Populated on inventory reads (product.inventory == null); null when nested
    // inside a product response.
    public ProductDto? Product { get; set; }

    public int QuantityOnHand { get; set; }
    public int ReorderLevel { get; set; }
    public string WarehouseLocation { get; set; } = string.Empty;
    public DateTime LastRestocked { get; set; }
}
