namespace Orders.Api.Models;

public class Order
{
    public int Id { get; set; }
    // Cross-service reference stored as a plain int column (no cross-DB FK).
    public int CustomerId { get; set; }
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Pending";
    public decimal TotalAmount { get; set; }
    public string ShippingAddress { get; set; } = string.Empty;
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
