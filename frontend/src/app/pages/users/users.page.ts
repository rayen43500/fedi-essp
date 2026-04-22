import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { UserSummary } from '../../core/models';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="users-page">
      <div class="page-header">
        <h1>Gestion des Utilisateurs</h1>
        <p class="subtitle">Administrez les comptes et les rôles de la plateforme.</p>
      </div>

      <div class="users-container">
        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôles</th>
                <th>Statut</th>
                <th class="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of users()">
                <td>
                  <div class="user-cell">
                    <div class="avatar">{{ user.fullName.charAt(0) }}</div>
                    <div class="details">
                      <strong>{{ user.fullName }}</strong>
                      <span>{{ user.email }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="roles-list">
                    <span class="role-badge" *ngFor="let role of user.roles">{{ role }}</span>
                  </div>
                </td>
                <td>
                  <span class="status-indicator" [class.active]="user.active">
                    {{ user.active ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
                <td class="actions-col">
                  <button class="btn-toggle" [class.deactivate]="user.active" (click)="toggle(user)">
                    {{ user.active ? 'Désactiver' : 'Activer' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .users-page { max-width: 1100px; margin: 0 auto; display: grid; gap: 2rem; }
      .page-header h1 { font-size: 2.2rem; color: #0f172a; margin-bottom: 0.5rem; }
      .page-header .subtitle { color: #64748b; font-size: 1.1rem; }

      .table-card {
        background: #fff;
        border-radius: 24px;
        border: 1px solid #f1f5f9;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.03);
        overflow: hidden;
      }

      table { width: 100%; border-collapse: collapse; text-align: left; }
      th { background: #f8fafc; padding: 1rem 1.5rem; font-size: 0.85rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
      td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
      
      .user-cell { display: flex; align-items: center; gap: 1rem; }
      .avatar { width: 40px; height: 40px; background: var(--brand-blue-light); color: var(--brand-blue); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; }
      .details strong { display: block; color: #1e293b; font-size: 1rem; }
      .details span { color: #64748b; font-size: 0.85rem; }

      .roles-list { display: flex; gap: 0.5rem; flex-wrap: wrap; }
      .role-badge { background: #f1f5f9; color: #475569; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }

      .status-indicator { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 600; color: #ef4444; }
      .status-indicator.active { color: #22c55e; }
      .status-indicator::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: currentColor; }

      .actions-col { text-align: right; }
      .btn-toggle {
        background: var(--brand-blue);
        color: #fff;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.9rem;
      }
      .btn-toggle.deactivate { background: #fee2e2; color: #ef4444; }
      .btn-toggle.deactivate:hover { background: #fecaca; }
      .btn-toggle:not(.deactivate):hover { background: var(--brand-blue-light); color: var(--brand-blue); }

      @media (max-width: 768px) {
        th:nth-child(2), td:nth-child(2) { display: none; }
      }
    `
  ]
})
export class UsersPage implements OnInit {
  readonly users = signal<UserSummary[]>([]);

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.api.users().subscribe((res: UserSummary[]) => this.users.set(res));
  }

  toggle(user: UserSummary) {
    this.api.setUserActive(user.id, !user.active).subscribe(() => this.load());
  }
}
