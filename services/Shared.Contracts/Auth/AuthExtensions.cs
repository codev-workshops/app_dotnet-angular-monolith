using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace Shared.Contracts.Auth;

public static class AuthConstants
{
    public const string Issuer = "OrderManager.Gateway";
    public const string Audience = "OrderManager.Services";

    // Dev-only fallback signing key (HS256 needs >= 256 bits). Override in
    // production via configuration key "Jwt:Key".
    public const string DevSigningKey = "orander-manager-dev-signing-key-change-me-please-32b+";

    public static string SigningKey(IConfiguration config) => config["Jwt:Key"] ?? DevSigningKey;
}

public static class AuthExtensions
{
    // Registers JWT bearer authentication shared by every service + the gateway.
    public static IServiceCollection AddJwtAuth(this IServiceCollection services, IConfiguration config)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(AuthConstants.SigningKey(config)));
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = AuthConstants.Issuer,
                    ValidAudience = AuthConstants.Audience,
                    IssuerSigningKey = key,
                    ClockSkew = TimeSpan.FromSeconds(5)
                };
            });
        services.AddAuthorization();
        return services;
    }

    // CORS locked to the gateway/frontend origin(s) instead of AllowAnyOrigin.
    // Configure via "Cors:AllowedOrigins" (comma-separated); defaults to the gateway origin.
    public const string CorsPolicy = "RestrictedCors";

    public static IServiceCollection AddRestrictedCors(this IServiceCollection services, IConfiguration config)
    {
        var origins = (config["Cors:AllowedOrigins"] ?? "http://localhost:5100")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        services.AddCors(o => o.AddPolicy(CorsPolicy, p =>
            p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod()));
        return services;
    }
}

// Issues short-lived JWTs (used by the gateway's identity endpoint).
public static class JwtTokenFactory
{
    public static (string token, int expiresInSeconds) Create(IConfiguration config, string username)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(AuthConstants.SigningKey(config)));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = TimeSpan.FromHours(8);
        var jwt = new JwtSecurityToken(
            issuer: AuthConstants.Issuer,
            audience: AuthConstants.Audience,
            claims: new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, username),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            },
            expires: DateTime.UtcNow.Add(expires),
            signingCredentials: creds);
        return (new JwtSecurityTokenHandler().WriteToken(jwt), (int)expires.TotalSeconds);
    }
}
