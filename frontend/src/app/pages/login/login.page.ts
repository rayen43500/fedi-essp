import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="login-wrap">
      <div class="card">
        <h1>Support Desk Intelligent</h1>
        <p>Connectez-vous pour gerer vos tickets.</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>Email</label>
          <input type="email" formControlName="email" placeholder="client@support.local" />

          <label>Mot de passe</label>
          <input type="password" formControlName="password" placeholder="********" />

          <button type="submit" [disabled]="loading() || form.invalid">{{ loading() ? 'Connexion...' : 'Se connecter' }}</button>
          <small class="error" *ngIf="error()">{{ error() }}</small>
        </form>

        <div class="demo">
          <strong>Comptes demo:</strong>
          <span>admin&#64;support.local / admin123</span>
          <span>agent&#64;support.local / agent123</span>
          <span>client&#64;support.local / client123</span>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .login-wrap {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 2rem;
      }
      .card {
        width: min(460px, 100%);
        background: rgba(255, 255, 255, 0.92);
        backdrop-filter: blur(8px);
        border-radius: 18px;
        padding: 2rem;
        box-shadow: 0 20px 50px rgba(16, 24, 40, 0.18);
      }
      h1 {
        margin: 0;
        font-size: 2rem;
      }
      p {
        margin-top: 0.4rem;
        color: #4f5f6f;
      }
      form {
        margin-top: 1.5rem;
        display: grid;
        gap: 0.7rem;
      }
      label {
        font-size: 0.9rem;
        color: #223;
      }
      input {
        border: 1px solid #c9d4df;
        border-radius: 10px;
        padding: 0.75rem 0.85rem;
        font-size: 1rem;
      }
      button {
        margin-top: 0.8rem;
        border: 0;
        background: linear-gradient(135deg, #0f766e, #0b4a6b);
        color: #fff;
        border-radius: 10px;
        padding: 0.8rem 1rem;
        font-weight: 600;
        cursor: pointer;
      }
      button:disabled {
        opacity: 0.7;
      }
      .error {
        color: #b42318;
      }
      .demo {
        margin-top: 1.2rem;
        display: grid;
        gap: 0.25rem;
        color: #35485a;
        font-size: 0.9rem;
      }
    `
  ]
})
export class LoginPage {
  readonly form;

  readonly loading = signal(false);
  readonly error = signal('');

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  submit() {
    if (this.form.invalid) {
      return;
    }

    this.error.set('');
    this.loading.set(true);

    this.auth.login(this.form.getRawValue() as { email: string; password: string }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Echec de connexion');
      }
    });
  }
}
