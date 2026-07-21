namespace Shared.Contracts.Dtos;

// Mirrors OrderManager.Api.Models.OrderItem serialized with ReferenceHandler.IgnoreCycles.
// LineTotal is emitted as a computed value (Quantity * UnitPrice) exactly as the
// monolith's read-only LineTotal property serializes.
public class OrderItemDto
{
    public int Id { get; set; }
    public int OrderId { get; set; }

    // Always null in serialized responses (cycle back to the owning order).
    public OrderDto? Order { get; set; }

    public int ProductId { get; set; }
    public ProductDto? Product { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}
