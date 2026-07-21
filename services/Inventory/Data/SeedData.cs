using Inventory.Api.Models;

namespace Inventory.Api.Data;

public static class SeedData
{
    public static void Initialize(InventoryDbContext context)
    {
        context.Database.EnsureCreated();
        if (context.InventoryItems.Any()) return;

        // Mirrors the monolith slice: 5 items, ProductId 1..5, QoH 50/100/150/200/250,
        // ReorderLevel 10, WarehouseLocation A-01..A-05.
        for (var i = 0; i < 5; i++)
        {
            context.InventoryItems.Add(new InventoryItem
            {
                ProductId = i + 1,
                QuantityOnHand = (i + 1) * 50,
                ReorderLevel = 10,
                WarehouseLocation = $"A-{i + 1:D2}"
            });
        }
        context.SaveChanges();
    }
}
