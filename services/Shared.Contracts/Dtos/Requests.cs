namespace Shared.Contracts.Dtos;

// Request bodies shared across services / gateway.

public record CreateOrderRequest(int CustomerId, List<OrderItemRequest> Items);
public record OrderItemRequest(int ProductId, int Quantity);
public record UpdateStatusRequest(string Status);

public record RestockRequest(int Quantity);

// Inventory saga endpoints.
public record ReserveRequest(int ProductId, int Quantity);
public record ReleaseRequest(int ProductId, int Quantity);

// Gateway token issuance.
public record TokenRequest(string Username, string Password);
public record TokenResponse(string Token, string TokenType, int ExpiresInSeconds);
