using Microsoft.AspNetCore.Http;

namespace Shared.Contracts.Http;

// Forwards the inbound request's Authorization header onto outbound
// service-to-service calls so downstream [Authorize] endpoints accept them.
public sealed class AuthForwardingHandler : DelegatingHandler
{
    private readonly IHttpContextAccessor _accessor;

    public AuthForwardingHandler(IHttpContextAccessor accessor) => _accessor = accessor;

    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var auth = _accessor.HttpContext?.Request.Headers.Authorization.ToString();
        if (!string.IsNullOrEmpty(auth) && request.Headers.Authorization is null)
            request.Headers.TryAddWithoutValidation("Authorization", auth);
        return base.SendAsync(request, cancellationToken);
    }
}
