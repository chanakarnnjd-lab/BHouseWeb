import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService, AuthUser } from '../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  signingOut = false;
  logoutErrorMessage = '';

  constructor(private readonly router: Router, private readonly authService: AuthService) {}

  get user(): AuthUser | null {
    return this.authService.getCurrentUser();
  }

  signOut(): void {
    if (this.signingOut) return;
    this.signingOut = true;
    this.logoutErrorMessage = '';

    this.authService.logout().subscribe({
      next: () => void this.router.navigateByUrl('/login', { replaceUrl: true }),
      error: (error: unknown) => {
        this.signingOut = false;
        this.logoutErrorMessage = error instanceof HttpErrorResponse
          ? `Could not sign out (HTTP ${error.status}). Check the connection and try again.`
          : error instanceof Error ? error.message : 'Could not sign out. Please try again.';
      }
    });
  }
}
