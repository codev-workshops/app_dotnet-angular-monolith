import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';

// Obtains and caches a JWT from the gateway's identity endpoint so that
// requests to the JWT-protected /api/* routes are authorized.
@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  token = '';

  constructor(private http: HttpClient) {}

  async fetchToken(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ token: string }>(
          `${environment.apiUrl}/auth/token`,
          { username: 'web', password: 'web' }
        )
      );
      this.token = res?.token ?? '';
    } catch {
      this.token = '';
    }
  }
}
