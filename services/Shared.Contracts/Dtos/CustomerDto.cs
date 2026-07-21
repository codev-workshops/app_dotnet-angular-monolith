namespace Shared.Contracts.Dtos;

// Mirrors OrderManager.Api.Models.Customer serialized with ReferenceHandler.IgnoreCycles.
// Property declaration order == JSON property order (System.Text.Json default).
public class CustomerDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string ZipCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    // List endpoint => [] ; by-id => [orders] ; nested inside an order => [null].
    // Elements are nullable to reproduce the EF-fixup "[null]" back-reference.
    public List<OrderDto?>? Orders { get; set; }
}
