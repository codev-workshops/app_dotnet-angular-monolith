// In production the SPA is served behind the API gateway, so same-origin
// relative /api/* paths reach the gateway directly.
export const environment = { production: true, apiUrl: '' };
