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

// Identity endpoint: validate credentials against the configured user store
// ("Auth:Users") and issue a JWT. Swap CredentialStore for a real identity
// provider in production.
app.MapPost("/auth/token", (TokenRequest req, IConfiguration config) =>
{
    if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
        return Results.BadRequest(new { message = "username and password required" });
    if (!CredentialStore.Validate(config, req.Username, req.Password))
        return Results.Json(new { message = "invalid credentials" }, statusCode: 401);
    var (token, expires) = JwtTokenFactory.Create(config, req.Username);
    return Results.Ok(new TokenResponse(token, "Bearer", expires));
});

app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "gateway" }));

// Proxied API routes require an authenticated caller (see AuthorizationPolicy in config).
app.MapReverseProxy();

app.Run();
