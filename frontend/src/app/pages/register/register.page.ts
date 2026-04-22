import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="register-wrap">
      <div class="card">
        <h1>Creer un compte client</h1>
        <p>Inscription rapide pour soumettre et suivre vos tickets.</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>Nom complet</label>
          <input type="text" formControlName="fullName" placeholder="Votre nom complet" />

          <label>Email</label>
          <input type="email" formControlName="email" placeholder="exemple@email.com" />

          <label>Mot de passe</label>
          <input type="password" formControlName="password" placeholder="Au moins 6 caracteres" />

          <button type="submit" [disabled]="loading() || form.invalid">{{ loading() ? 'Creation...' : 'Creer mon compte' }}</button>
          <small class="error" *ngIf="error()">{{ error() }}</small>
        </form>

        <div class="links">
          <span>Vous avez deja un compte ?</span>
          <a routerLink="/login">Se connecter</a>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .register-wrap {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 2rem;
      }
      .card {
        width: min(500px, 100%);
        background: rgba(255, 255, 255, 0.94);
        border-radius: 18px;
        padding: 2rem;
        box-shadow: 0 20px 50px rgba(16, 24, 40, 0.16);
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
        margin-top: 1.4rem;
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
        opacity: 0.72;
      }
      .error {
        color: #b42318;
      }
      .links {
        margin-top: 1rem;
        display: flex;
        gap: 0.35rem;
        align-items: center;
        color: #4f5f6f;
      }
      .links a {
        color: #0b4a6b;
        font-weight: 700;
        text-decoration: none;
      }
    `
  ]
})
export class RegisterPage {
  readonly form;
  readonly loading = signal(false);
  readonly error = signal('');

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router
  ) {
    this.form = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  submit() {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.register(this.form.getRawValue() as { fullName: string; email: string; password: string }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/app/dashboard');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? "Impossible de creer le compte");
      }
    });
  }
}
