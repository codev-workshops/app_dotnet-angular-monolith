using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Orders.Api.Services;
using Shared.Contracts.Dtos;

namespace Orders.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly OrderService _service;
    public OrdersController(OrderService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllOrdersAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var order = await _service.GetOrderByIdAsync(id);
        return order is null ? NotFound() : Ok(order);
    }

    // Used by the Customers service to compose a customer's orders.
    [HttpGet("customer/{customerId}")]
    public async Task<IActionResult> GetByCustomer(int customerId) =>
        Ok(await _service.GetOrdersByCustomerAsync(customerId));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest request)
    {
        var items = request.Items.Select(i => (i.ProductId, i.Quantity)).ToList();
        var order = await _service.CreateOrderAsync(request.CustomerId, items);
        return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
    {
        var order = await _service.UpdateOrderStatusAsync(id, request.Status);
        return Ok(order);
    }
}
