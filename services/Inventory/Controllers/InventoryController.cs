using Inventory.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Contracts.Dtos;

namespace Inventory.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/inventory")]
public class InventoryController : ControllerBase
{
    private readonly InventoryService _service;
    public InventoryController(InventoryService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllInventoryAsync());

    [HttpGet("product/{productId}")]
    public async Task<IActionResult> GetByProduct(int productId)
    {
        var item = await _service.GetInventoryByProductIdAsync(productId);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("product/{productId}/restock")]
    public async Task<IActionResult> Restock(int productId, [FromBody] RestockRequest request)
    {
        var item = await _service.RestockAsync(productId, request.Quantity);
        return Ok(item);
    }

    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStock() => Ok(await _service.GetLowStockItemsAsync());

    // Saga endpoints used by the Orders service.
    [HttpPost("reserve")]
    public async Task<IActionResult> Reserve([FromBody] ReserveRequest request)
    {
        var ok = await _service.ReserveAsync(request.ProductId, request.Quantity);
        return ok ? Ok() : Conflict(new { message = "Insufficient stock" });
    }

    [HttpPost("release")]
    public async Task<IActionResult> Release([FromBody] ReleaseRequest request)
    {
        await _service.ReleaseAsync(request.ProductId, request.Quantity);
        return Ok();
    }
}

// Internal (service-to-service) endpoint: base inventory without product composition.
[ApiController]
[Authorize]
[Route("internal/inventory")]
public class InventoryInternalController : ControllerBase
{
    private readonly InventoryService _service;
    public InventoryInternalController(InventoryService service) => _service = service;

    [HttpGet("product/{productId}")]
    public async Task<IActionResult> GetBase(int productId)
    {
        var item = await _service.GetBaseInventoryByProductAsync(productId);
        return item is null ? NotFound() : Ok(item);
    }
}
