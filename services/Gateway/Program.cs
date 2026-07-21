using Shared.Contracts.Auth;
using Shared.Contracts.Dtos;

var builder = WebApplication.CreateBuilder(args);

// YARP reverse proxy (routes/clusters loaded from configuration).
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

// JWT issuance + validation happens at the gateway; the Authorization header is
// then forwarded to the downstream services (which also validate it).
builder.Services.AddJwtAuth(builder.Configuration);

var frontendOrigins = (builder.Configuration["Cors:AllowedOrigins"]
        ?? "http://localhost:4200,http://localhost:5100")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(frontendOrigins).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// Identity endpoint: issue a JWT for the demo. Any non-empty username is accepted
// in this workshop build; wire to a real identity provider for production.
app.MapPost("/auth/token", (TokenRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req.Username))
        return Results.BadRequest(new { message = "username required" });
    var (token, expires) = JwtTokenFactory.Create(app.Configuration, req.Username);
    return Results.Ok(new TokenResponse(token, "Bearer", expires));
});

app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "gateway" }));

// Proxied API routes require an authenticated caller (see AuthorizationPolicy in config).
app.MapReverseProxy();

app.Run();
