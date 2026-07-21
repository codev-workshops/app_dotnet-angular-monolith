using Customers.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Contracts.Dtos;

namespace Customers.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/customers")]
public class CustomersController : ControllerBase
{
    private readonly CustomerService _service;
    public CustomersController(CustomerService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllCustomersAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var customer = await _service.GetCustomerByIdAsync(id);
        return customer is null ? NotFound() : Ok(customer);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CustomerDto customer)
    {
        var created = await _service.CreateCustomerAsync(customer);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }
}

// Internal (service-to-service) endpoint: base customer without orders composition.
[ApiController]
[Authorize]
[Route("internal/customers")]
public class CustomersInternalController : ControllerBase
{
    private readonly CustomerService _service;
    public CustomersInternalController(CustomerService service) => _service = service;

    [HttpGet("{id}")]
    public async Task<IActionResult> GetBase(int id)
    {
        var customer = await _service.GetBaseCustomerAsync(id);
        return customer is null ? NotFound() : Ok(customer);
    }
}
