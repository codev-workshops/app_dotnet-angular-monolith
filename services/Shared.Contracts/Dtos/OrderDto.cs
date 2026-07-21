namespace Shared.Contracts.Dtos;

// Mirrors OrderManager.Api.Models.Order serialized with ReferenceHandler.IgnoreCycles.
public class OrderDto
{
    public int Id { get; set; }
    public int CustomerId { get; set; }

    // Populated on order reads (customer.orders == [null]); null when nested
    // inside a customer-by-id response.
    public CustomerDto? Customer { get; set; }

    public DateTime OrderDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string ShippingAddress { get; set; } = string.Empty;

    // Populated on order reads; [] when nested inside a customer-by-id response.
    public List<OrderItemDto?>? Items { get; set; }
}
