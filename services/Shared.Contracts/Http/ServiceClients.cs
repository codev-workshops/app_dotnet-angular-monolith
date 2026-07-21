using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Shared.Contracts.Dtos;

namespace Shared.Contracts.Http;

// Typed, resilient HTTP clients used for cross-service object composition.
// Base addresses come from configuration ("Services:<Name>") with localhost
// defaults matching the frozen port map.

public static class ServiceDefaults
{
    public const string Customers = "http://localhost:5101";
    public const string Products = "http://localhost:5102";
    public const string Inventory = "http://localhost:5103";
    public const string Orders = "http://localhost:5104";
    public static readonly TimeSpan HttpTimeout = TimeSpan.FromSeconds(10);
}

public sealed class CustomersClient
{
    private readonly HttpClient _http;
    public CustomersClient(HttpClient http) => _http = http;

    // Base customer record (no orders composition) used to build nested customer objects.
    public Task<CustomerDto?> GetBaseCustomerAsync(int id, CancellationToken ct = default) =>
        _http.GetFromJsonAsync<CustomerDto>($"/internal/customers/{id}", ct);
}

public sealed class ProductsClient
{
    private readonly HttpClient _http;
    public ProductsClient(HttpClient http) => _http = http;

    // Base product record (inventory == null, orderItems == []) used to build nested products.
    public Task<ProductDto?> GetBaseProductAsync(int id, CancellationToken ct = default) =>
        _http.GetFromJsonAsync<ProductDto>($"/internal/products/{id}", ct);
}

public sealed class InventoryClient
{
    private readonly HttpClient _http;
    public InventoryClient(HttpClient http) => _http = http;

    // Base inventory record (product == null) used to build a product's nested inventory.
    public Task<InventoryDto?> GetBaseInventoryByProductAsync(int productId, CancellationToken ct = default) =>
        _http.GetFromJsonAsync<InventoryDto>($"/internal/inventory/product/{productId}", ct);

    // Saga: decrement stock. Throws on failure so the order saga can compensate.
    public async Task ReserveAsync(int productId, int quantity, CancellationToken ct = default)
    {
        var resp = await _http.PostAsJsonAsync("/api/inventory/reserve",
            new ReserveRequest(productId, quantity), ct);
        if (!resp.IsSuccessStatusCode)
            throw new InvalidOperationException(
                $"Reserve failed for product {productId} (status {(int)resp.StatusCode})");
    }

    // Compensating action: return previously reserved stock. Best-effort.
    public async Task ReleaseAsync(int productId, int quantity, CancellationToken ct = default)
    {
        var resp = await _http.PostAsJsonAsync("/api/inventory/release",
            new ReleaseRequest(productId, quantity), ct);
        resp.EnsureSuccessStatusCode();
    }
}

public sealed class OrdersClient
{
    private readonly HttpClient _http;
    public OrdersClient(HttpClient http) => _http = http;

    // Orders for a customer, already shaped as customer==null, items==[].
    public async Task<List<OrderDto>> GetOrdersByCustomerAsync(int customerId, CancellationToken ct = default) =>
        await _http.GetFromJsonAsync<List<OrderDto>>($"/api/orders/customer/{customerId}", ct)
        ?? new List<OrderDto>();
}

public static class ServiceClientExtensions
{
    // Registers all typed clients with auth-forwarding + retry. A service may
    // inject only the clients it actually uses.
    public static IServiceCollection AddServiceClients(this IServiceCollection services, IConfiguration config)
    {
        services.AddHttpContextAccessor();
        services.AddTransient<AuthForwardingHandler>();

        Register<CustomersClient>(services, config, "Customers", ServiceDefaults.Customers);
        Register<ProductsClient>(services, config, "Products", ServiceDefaults.Products);
        Register<InventoryClient>(services, config, "Inventory", ServiceDefaults.Inventory);
        Register<OrdersClient>(services, config, "Orders", ServiceDefaults.Orders);
        return services;
    }

    private static void Register<TClient>(IServiceCollection services, IConfiguration config,
        string name, string defaultUri) where TClient : class
    {
        var baseUri = config[$"Services:{name}"] ?? defaultUri;
        services.AddHttpClient<TClient>(c =>
            {
                c.BaseAddress = new Uri(baseUri);
                c.Timeout = ServiceDefaults.HttpTimeout;
            })
            .AddHttpMessageHandler<AuthForwardingHandler>()
            .AddHttpMessageHandler(() => new RetryHandler());
    }
}
