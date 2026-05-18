import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="profile-page">
      <div class="page-header">
        <p class="eyebrow">Mon compte</p>
        <h1>Profil et préférences</h1>
        <p class="subtitle">Mettez à jour vos informations et votre photo de profil.</p>
      </div>

      <div class="profile-grid">
        <article class="card avatar-card">
          <h2>Photo de profil</h2>
          <div class="avatar-preview">
            <img *ngIf="auth.currentUser()?.avatarUrl; else initialAvatar" [src]="avatarPreview()" alt="Photo de profil" />
            <ng-template #initialAvatar>
              <span>{{ userInitial() }}</span>
            </ng-template>
          </div>
          <label class="upload-btn">
            <input type="file" accept="image/jpeg,image/png,image/webp" (change)="onAvatarSelected($event)" />
            Changer la photo
          </label>
          <p class="hint">JPEG, PNG ou WebP — max 2 Mo</p>
          <p class="notice" *ngIf="avatarNotice()">{{ avatarNotice() }}</p>
        </article>

        <article class="card">
          <h2>Informations personnelles</h2>
          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="form-grid">
            <div class="field">
              <label for="fullName">Nom complet</label>
              <input id="fullName" formControlName="fullName" />
            </div>
            <div class="field">
              <label for="email">Email</label>
              <input id="email" type="email" formControlName="email" />
            </div>
            <button type="submit" class="btn-primary" [disabled]="profileForm.invalid || savingProfile()">
              {{ savingProfile() ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </form>
        </article>

        <article class="card">
          <h2>Sécurité</h2>
          <form [formGroup]="passwordForm" (ngSubmit)="savePassword()" class="form-grid">
            <div class="field">
              <label for="currentPassword">Mot de passe actuel</label>
              <input id="currentPassword" type="password" formControlName="currentPassword" />
            </div>
            <div class="field">
              <label for="newPassword">Nouveau mot de passe</label>
              <input id="newPassword" type="password" formControlName="newPassword" />
            </div>
            <button type="submit" class="btn-secondary" [disabled]="passwordForm.invalid || savingPassword()">
              {{ savingPassword() ? 'Mise à jour...' : 'Changer le mot de passe' }}
            </button>
          </form>
        </article>
      </div>

      <p class="error" *ngIf="error()">{{ error() }}</p>
    </section>
  `,
  styles: [
    `
      .profile-page {
        max-width: 960px;
        margin: 0 auto;
        display: grid;
        gap: 1.5rem;
      }

      .eyebrow {
        color: var(--brand-orange-dark);
        font-size: 0.76rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      h1 {
        font-size: 2rem;
        margin-top: 0.35rem;
      }

      .subtitle {
        color: var(--text-secondary);
        margin-top: 0.4rem;
      }

      .profile-grid {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 1rem;
      }

      .card {
        background: #fff;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        padding: 1.2rem;
        box-shadow: var(--shadow-sm);
        display: grid;
        gap: 0.85rem;
      }

      .card h2 {
        font-size: 1.05rem;
      }

      .avatar-card {
        align-content: start;
      }

      .avatar-preview {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        overflow: hidden;
        border: 3px solid var(--brand-blue-soft);
        display: grid;
        place-items: center;
        background: var(--surface-soft);
        color: var(--brand-blue);
        font-size: 2.2rem;
        font-weight: 900;
      }

      .avatar-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .upload-btn {
        display: inline-flex;
        width: fit-content;
        padding: 0.55rem 0.9rem;
        background: var(--brand-blue);
        color: #fff;
        border-radius: var(--radius-md);
        font-weight: 900;
        cursor: pointer;
      }

      .upload-btn input {
        display: none;
      }

      .hint {
        color: var(--text-muted);
        font-size: 0.82rem;
      }

      .notice {
        color: var(--success);
        font-weight: 800;
        font-size: 0.86rem;
      }

      .form-grid {
        display: grid;
        gap: 0.75rem;
      }

      .field {
        display: grid;
        gap: 0.35rem;
      }

      .field label {
        font-weight: 900;
        font-size: 0.86rem;
      }

      .field input {
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        padding: 0.7rem 0.85rem;
      }

      .btn-primary,
      .btn-secondary {
        width: fit-content;
        min-height: 40px;
        border: 0;
        border-radius: var(--radius-md);
        padding: 0.65rem 1rem;
        font-weight: 900;
        cursor: pointer;
      }

      .btn-primary {
        background: var(--brand-blue);
        color: #fff;
      }

      .btn-secondary {
        background: var(--surface-soft);
        color: var(--brand-blue);
      }

      .error {
        color: var(--danger);
        background: var(--danger-soft);
        padding: 0.8rem 1rem;
        border-radius: var(--radius-md);
        font-weight: 800;
      }

      @media (max-width: 800px) {
        .profile-grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class ProfilePage implements OnInit {
  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);
  readonly avatarNotice = signal('');
  readonly error = signal('');

  readonly profileForm;
  readonly passwordForm;

  constructor(
    private readonly api: ApiService,
    readonly auth: AuthService,
    private readonly fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]]
    });
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.profileForm.patchValue({ fullName: user.fullName, email: user.email });
    }
    this.api.profile().subscribe({
      next: (user) => {
        this.auth.updateCurrentUser(user);
        this.profileForm.patchValue({ fullName: user.fullName, email: user.email });
      }
    });
  }

  avatarPreview(): string {
    return this.auth.mediaUrl(this.auth.currentUser()?.avatarUrl);
  }

  userInitial(): string {
    return this.auth.currentUser()?.fullName?.charAt(0).toUpperCase() || 'U';
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.avatarNotice.set('');
    this.api.uploadAvatar(file).subscribe({
      next: (user) => {
        this.auth.updateCurrentUser(user);
        this.avatarNotice.set('Photo mise à jour.');
      },
      error: () => this.error.set("Impossible d'envoyer la photo.")
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      return;
    }
    this.savingProfile.set(true);
    this.error.set('');
    this.api.updateProfile(this.profileForm.getRawValue() as { fullName: string; email: string }).subscribe({
      next: (user) => {
        this.auth.updateCurrentUser(user);
        this.savingProfile.set(false);
        this.avatarNotice.set('Profil enregistré.');
      },
      error: (err) => {
        this.savingProfile.set(false);
        this.error.set(err?.error?.message ?? 'Mise à jour impossible.');
      }
    });
  }

  savePassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }
    this.savingPassword.set(true);
    this.error.set('');
    this.api.changePassword(this.passwordForm.getRawValue() as { currentPassword: string; newPassword: string }).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.passwordForm.reset();
        this.avatarNotice.set('Mot de passe modifié.');
      },
      error: (err) => {
        this.savingPassword.set(false);
        this.error.set(err?.error?.message ?? 'Mot de passe non modifié.');
      }
    });
  }
}
