import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;
  submitting = false;
  errorMessage = '';

  constructor(private readonly router: Router, private readonly authService: AuthService) {}

  signIn(): void {
    this.submitting = true;
    this.errorMessage = '';
    this.authService.login({ email: this.email.trim(), password: this.password }).subscribe({
      next: () => this.router.navigate(['/recipes']),
      error: (error: unknown) => {
        this.submitting = false;
        if (error instanceof HttpErrorResponse) {
          const message = error.error && typeof error.error === 'object' && 'message' in error.error
            ? error.error.message
            : null;
          this.errorMessage = typeof message === 'string'
            ? message
            : `Sign in failed (HTTP ${error.status}). Please try again.`;
        } else {
          this.errorMessage = error instanceof Error ? error.message : 'Sign in failed. Please try again.';
        }
      }
    });
  }
}
