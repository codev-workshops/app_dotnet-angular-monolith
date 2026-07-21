namespace Orders.Api.Data;

public static class SeedData
{
    // Orders start empty (matching the monolith's initial state); ensure schema exists.
    public static void Initialize(OrderDbContext context) => context.Database.EnsureCreated();
}
