using Customers.Api.Data;
using Customers.Api.Models;
using Microsoft.EntityFrameworkCore;
using Shared.Contracts.Dtos;
using Shared.Contracts.Http;

namespace Customers.Api.Services;

public class CustomerService
{
    private readonly CustomerDbContext _context;
    private readonly OrdersClient _orders;

    public CustomerService(CustomerDbContext context, OrdersClient orders)
    {
        _context = context;
        _orders = orders;
    }

    // List: customers WITHOUT orders composition (orders == []), matching the monolith.
    public async Task<List<CustomerDto>> GetAllCustomersAsync()
    {
        var customers = await _context.Customers.ToListAsync();
        return customers.Select(c => ToDto(c, new List<OrderDto?>())).ToList();
    }

    // By-id: compose the customer's orders via an HTTP call to the Orders service.
    // The fetched orders already have customer == null and items == [].
    public async Task<CustomerDto?> GetCustomerByIdAsync(int id)
    {
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == id);
        if (customer is null) return null;

        var orders = await _orders.GetOrdersByCustomerAsync(id);
        return ToDto(customer, orders.Cast<OrderDto?>().ToList());
    }

    // Base representation used by other services (no orders composition).
    public async Task<CustomerDto?> GetBaseCustomerAsync(int id)
    {
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == id);
        return customer is null ? null : ToDto(customer, new List<OrderDto?>());
    }

    public async Task<CustomerDto> CreateCustomerAsync(CustomerDto input)
    {
        var customer = new Customer
        {
            Name = input.Name,
            Email = input.Email,
            Phone = input.Phone,
            Address = input.Address,
            City = input.City,
            State = input.State,
            ZipCode = input.ZipCode
        };
        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();
        return ToDto(customer, new List<OrderDto?>());
    }

    private static CustomerDto ToDto(Customer c, List<OrderDto?> orders) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Email = c.Email,
        Phone = c.Phone,
        Address = c.Address,
        City = c.City,
        State = c.State,
        ZipCode = c.ZipCode,
        CreatedAt = c.CreatedAt,
        Orders = orders
    };
}
