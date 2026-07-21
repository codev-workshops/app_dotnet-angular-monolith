namespace Inventory.Api.Models;

public class InventoryItem
{
    public int Id { get; set; }
    // Cross-service reference stored as a plain int column (no cross-DB FK).
    public int ProductId { get; set; }
    public int QuantityOnHand { get; set; }
    public int ReorderLevel { get; set; } = 10;
    public string WarehouseLocation { get; set; } = string.Empty;
    public DateTime LastRestocked { get; set; } = DateTime.UtcNow;
}
