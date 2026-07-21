using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Products.Api.Services;
using Shared.Contracts.Dtos;

namespace Products.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly ProductService _service;
    public ProductsController(ProductService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllProductsAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var product = await _service.GetProductByIdAsync(id);
        return product is null ? NotFound() : Ok(product);
    }

    [HttpGet("category/{category}")]
    public async Task<IActionResult> GetByCategory(string category) =>
        Ok(await _service.GetProductsByCategoryAsync(category));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ProductDto product)
    {
        var created = await _service.CreateProductAsync(product);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }
}

// Internal (service-to-service) endpoint: base product without inventory composition.
[ApiController]
[Authorize]
[Route("internal/products")]
public class ProductsInternalController : ControllerBase
{
    private readonly ProductService _service;
    public ProductsInternalController(ProductService service) => _service = service;

    [HttpGet("{id}")]
    public async Task<IActionResult> GetBase(int id)
    {
        var product = await _service.GetBaseProductAsync(id);
        return product is null ? NotFound() : Ok(product);
    }
}
