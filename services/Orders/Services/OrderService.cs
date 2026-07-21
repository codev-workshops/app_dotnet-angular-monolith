using Microsoft.EntityFrameworkCore;
using Orders.Api.Data;
using Orders.Api.Models;
using Shared.Contracts.Dtos;
using Shared.Contracts.Http;

namespace Orders.Api.Services;

public class OrderService
{
    private readonly OrderDbContext _context;
    private readonly CustomersClient _customers;
    private readonly ProductsClient _products;
    private readonly InventoryClient _inventory;

    public OrderService(OrderDbContext context, CustomersClient customers,
        ProductsClient products, InventoryClient inventory)
    {
        _context = context;
        _customers = customers;
        _products = products;
        _inventory = inventory;
    }

    public async Task<List<OrderDto>> GetAllOrdersAsync()
    {
        var orders = await _context.Orders
            .Include(o => o.Items)
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync();

        var result = new List<OrderDto>(orders.Count);
        foreach (var o in orders)
            result.Add(await ComposeReadAsync(o));
        return result;
    }

    public async Task<OrderDto?> GetOrderByIdAsync(int id)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);
        return order is null ? null : await ComposeReadAsync(order);
    }

    // Orders for a customer, shaped for the customer-by-id response:
    // customer == null, items == []. No cross-service composition (avoids a cycle
    // back to the Customers service).
    public async Task<List<OrderDto>> GetOrdersByCustomerAsync(int customerId)
    {
        // Ascending Id order matches the monolith's unordered `.Include(c => c.Orders)`,
        // which materializes in primary-key order.
        var orders = await _context.Orders
            .Where(o => o.CustomerId == customerId)
            .OrderBy(o => o.Id)
            .ToListAsync();

        return orders.Select(o => new OrderDto
        {
            Id = o.Id,
            CustomerId = o.CustomerId,
            Customer = null,
            OrderDate = o.OrderDate,
            Status = o.Status,
            TotalAmount = o.TotalAmount,
            ShippingAddress = o.ShippingAddress,
            Items = new List<OrderItemDto?>()
        }).ToList();
    }

    // Saga: snapshot shipping address (Customers), snapshot unit price (Products),
    // reserve stock (Inventory) with compensating release on any failure.
    public async Task<OrderDto> CreateOrderAsync(int customerId, List<(int ProductId, int Quantity)> items)
    {
        var customer = await _customers.GetBaseCustomerAsync(customerId)
            ?? throw new ArgumentException($"Customer {customerId} not found");

        var order = new Order
        {
            CustomerId = customerId,
            ShippingAddress = $"{customer.Address}, {customer.City}, {customer.State} {customer.ZipCode}"
        };

        var reserved = new List<(int ProductId, int Quantity)>();
        try
        {
            foreach (var (productId, quantity) in items)
            {
                var product = await _products.GetBaseProductAsync(productId)
                    ?? throw new ArgumentException($"Product {productId} not found");

                await _inventory.ReserveAsync(productId, quantity);
                reserved.Add((productId, quantity));

                order.Items.Add(new OrderItem
                {
                    ProductId = productId,
                    Quantity = quantity,
                    UnitPrice = product.Price
                });
            }

            order.TotalAmount = order.Items.Sum(i => i.Quantity * i.UnitPrice);
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();
        }
        catch
        {
            foreach (var r in reserved)
            {
                try { await _inventory.ReleaseAsync(r.ProductId, r.Quantity); }
                catch { /* best-effort compensation */ }
            }
            throw;
        }

        return await ComposeReadAsync(order);
    }

    public async Task<OrderDto> UpdateOrderStatusAsync(int orderId, string status)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new ArgumentException($"Order {orderId} not found");
        order.Status = status;
        await _context.SaveChangesAsync();
        return await ComposeReadAsync(order);
    }

    // Read composition, reproducing the monolith's one-level Include depth +
    // IgnoreCycles fixup artifacts:
    //   customer present, customer.orders == [null]
    //   items[].order == null
    //   items[].product present, product.inventory == null, product.orderItems == [null]
    private async Task<OrderDto> ComposeReadAsync(Order order)
    {
        var customer = await _customers.GetBaseCustomerAsync(order.CustomerId);
        if (customer is not null)
            customer.Orders = new List<OrderDto?> { null };

        var items = new List<OrderItemDto?>(order.Items.Count);
        foreach (var item in order.Items.OrderBy(i => i.Id))
        {
            var product = await _products.GetBaseProductAsync(item.ProductId);
            if (product is not null)
                product.OrderItems = new List<OrderItemDto?> { null };

            items.Add(new OrderItemDto
            {
                Id = item.Id,
                OrderId = item.OrderId,
                Order = null,
                ProductId = item.ProductId,
                Product = product,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                LineTotal = item.Quantity * item.UnitPrice
            });
        }

        return new OrderDto
        {
            Id = order.Id,
            CustomerId = order.CustomerId,
            Customer = customer,
            OrderDate = order.OrderDate,
            Status = order.Status,
            TotalAmount = order.TotalAmount,
            ShippingAddress = order.ShippingAddress,
            Items = items
        };
    }
}
