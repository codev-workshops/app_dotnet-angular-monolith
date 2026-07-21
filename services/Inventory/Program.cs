using System.Text.Json.Serialization;
using Inventory.Api.Data;
using Inventory.Api.Services;
using Microsoft.EntityFrameworkCore;
using Shared.Contracts.Auth;
using Shared.Contracts.Http;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<InventoryDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=inventory.db"));

builder.Services.AddControllers().AddJsonOptions(options =>
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddJwtAuth(builder.Configuration);
builder.Services.AddRestrictedCors(builder.Configuration);
builder.Services.AddServiceClients(builder.Configuration);
builder.Services.AddScoped<InventoryService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
    SeedData.Initialize(scope.ServiceProvider.GetRequiredService<InventoryDbContext>());

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors(AuthExtensions.CorsPolicy);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "inventory" }));

app.Run();
