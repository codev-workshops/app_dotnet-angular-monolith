import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { APP_INITIALIZER } from '@angular/core';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { apiInterceptor } from './app/api.interceptor';
import { AuthTokenService } from './app/auth-token.service';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([apiInterceptor])),
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [AuthTokenService],
      useFactory: (auth: AuthTokenService) => () => auth.fetchToken()
    }
  ]
});
