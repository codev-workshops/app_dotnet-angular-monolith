using System.Net;

namespace Shared.Contracts.Http;

// Resilient DelegatingHandler: retries transient failures (network errors,
// request timeouts, and 5xx/408 responses) with exponential backoff.
// A composition call that ultimately fails throws, so the caller returns an
// error rather than a partially-populated (shape-changing) success body.
public sealed class RetryHandler : DelegatingHandler
{
    private readonly int _maxAttempts;
    private readonly TimeSpan _baseDelay;

    public RetryHandler(int maxAttempts = 3, TimeSpan? baseDelay = null)
    {
        _maxAttempts = Math.Max(1, maxAttempts);
        _baseDelay = baseDelay ?? TimeSpan.FromMilliseconds(200);
    }

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        Exception? lastError = null;
        for (var attempt = 1; attempt <= _maxAttempts; attempt++)
        {
            try
            {
                var response = await base.SendAsync(request, cancellationToken);
                if (!IsTransient(response.StatusCode) || attempt == _maxAttempts)
                    return response;
                response.Dispose();
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException
                                       && !cancellationToken.IsCancellationRequested)
            {
                lastError = ex;
                if (attempt == _maxAttempts) throw;
            }

            await Task.Delay(_baseDelay * Math.Pow(2, attempt - 1), cancellationToken);
        }

        throw lastError ?? new HttpRequestException("Request failed after retries.");
    }

    private static bool IsTransient(HttpStatusCode code) =>
        (int)code >= 500 || code == HttpStatusCode.RequestTimeout;
}
