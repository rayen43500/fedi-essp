import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-wrap">
      <a class="brand" routerLink="/">
        <img src="/image.png" alt="Topnet" />
        <span>Support Topnet</span>
      </a>

      <div class="auth-grid">
        <div class="intro">
          <p class="eyebrow">Connexion sécurisée</p>
          <h1>Retrouvez vos tickets et vos priorités.</h1>
          <p>Un espace simple pour suivre les demandes, répondre plus vite et garder une trace claire des échanges.</p>
        </div>

        <div class="card">
          <h2>Se connecter</h2>
          <p class="hint">Utilisez votre compte support pour accéder au portail.</p>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="field">
              <label for="email">Email</label>
              <input id="email" type="email" formControlName="email" placeholder="client@support.local" autocomplete="email" />
            </div>

            <div class="field">
              <label for="password">Mot de passe</label>
              <input id="password" type="password" formControlName="password" placeholder="Votre mot de passe" autocomplete="current-password" />
            </div>

            <button type="submit" [disabled]="loading() || form.invalid">
              {{ loading() ? 'Connexion...' : 'Se connecter' }}
            </button>
            <small class="error" *ngIf="error()">{{ error() }}</small>
          </form>

          <div class="demo">
            <strong>Comptes démo</strong>
            <span>admin&#64;support.local / admin123</span>
            <span>agent&#64;support.local / agent123</span>
            <span>client&#64;support.local / client123</span>
          </div>

          <div class="links">
            <span>Nouveau ici ?</span>
            <a routerLink="/register">Créer un compte</a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .auth-wrap {
        min-height: 100vh;
        padding: 1.5rem;
        display: grid;
        align-content: center;
        gap: 2.5rem;
        background: linear-gradient(180deg, #ffffff 0%, #eef5fa 100%);
      }

      .brand {
        position: fixed;
        top: 1.25rem;
        left: 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: var(--brand-blue-dark);
        text-decoration: none;
        font-family: 'Sora', sans-serif;
        font-weight: 900;
      }

      .brand img {
        height: 36px;
      }

      .auth-grid {
        width: min(980px, 100%);
        margin: 0 auto;
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(360px, 440px);
        gap: 3rem;
        align-items: center;
      }

      .eyebrow {
        color: var(--brand-orange-dark);
        font-size: 0.78rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin-bottom: 0.8rem;
      }

      .intro h1 {
        font-size: 3rem;
        line-height: 1.08;
        max-width: 620px;
      }

      .intro p:not(.eyebrow) {
        color: var(--text-secondary);
        font-size: 1.08rem;
        line-height: 1.7;
        margin-top: 1rem;
        max-width: 540px;
      }

      .card {
        background: #fff;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        padding: 1.4rem;
        box-shadow: var(--shadow-md);
      }

      h2 {
        font-size: 1.55rem;
      }

      .hint {
        color: var(--text-secondary);
        margin-top: 0.35rem;
      }

      form {
        margin-top: 1.3rem;
        display: grid;
        gap: 0.9rem;
      }

      .field {
        display: grid;
        gap: 0.45rem;
      }

      label {
        font-size: 0.88rem;
        color: var(--text-primary);
        font-weight: 900;
      }

      input {
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        padding: 0.78rem 0.9rem;
      }

      input:focus {
        outline: none;
        border-color: var(--brand-blue);
        box-shadow: 0 0 0 4px rgba(0, 89, 163, 0.10);
      }

      button {
        margin-top: 0.3rem;
        min-height: 42px;
        border: 0;
        background: var(--brand-blue);
        color: #fff;
        border-radius: var(--radius-md);
        padding: 0.78rem 1rem;
        font-weight: 900;
        cursor: pointer;
      }

      button:disabled {
        opacity: 0.58;
        cursor: not-allowed;
      }

      .error {
        color: var(--danger);
        font-weight: 800;
      }

      .demo {
        margin-top: 1.1rem;
        padding: 0.9rem;
        border-radius: var(--radius-md);
        background: var(--surface-soft);
        display: grid;
        gap: 0.25rem;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }

      .demo strong {
        color: var(--text-primary);
      }

      .links {
        margin-top: 1rem;
        display: flex;
        gap: 0.4rem;
        color: var(--text-secondary);
      }

      .links a {
        color: var(--brand-blue);
        font-weight: 900;
        text-decoration: none;
      }

      @media (max-width: 820px) {
        .brand {
          position: static;
          width: min(440px, 100%);
          margin: 0 auto;
        }

        .auth-grid {
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        .intro h1 {
          font-size: 2.1rem;
        }
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

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.error.set('');
    this.loading.set(true);

    this.auth.login(this.form.getRawValue() as { email: string; password: string }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/app/dashboard');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Échec de connexion');
      }
    });
  }
}
