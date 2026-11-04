import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  submitting = false;
  registered = false;
  errorMessage = '';

  constructor(private readonly authService: AuthService) {}

  get passwordValid(): boolean {
    return /^[A-Za-z0-9]{8,12}$/.test(this.password);
  }

  get passwordsMatch(): boolean {
    return this.password === this.confirmPassword;
  }

  createAccount(): void {
    if (!this.passwordValid || !this.passwordsMatch) return;

    this.submitting = true;
    this.errorMessage = '';
    this.authService.register({
      name: this.name.trim(),
      email: this.email.trim(),
      password: this.password
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.registered = true;
      },
      error: (error: unknown) => {
        this.submitting = false;
        if (error instanceof HttpErrorResponse) {
          const message = error.error && typeof error.error === 'object' && 'message' in error.error
            ? error.error.message
            : null;
          this.errorMessage = typeof message === 'string'
            ? message
            : `Account creation failed (HTTP ${error.status}). Please try again.`;
        } else {
          this.errorMessage = error instanceof Error ? error.message : 'Account creation failed. Please try again.';
        }
      }
    });
  }
}
