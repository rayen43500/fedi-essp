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
        <div>
          <p class="eyebrow">Administration</p>
          <h1>Utilisateurs</h1>
        </div>
        <p class="subtitle">Gérez les accès, les rôles et l’activation des comptes.</p>
      </div>

      <p class="error" *ngIf="error()">{{ error() }}</p>

      <div class="table-card">
        <table *ngIf="users().length; else emptyUsers">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Rôles</th>
              <th>Statut</th>
              <th class="actions-col">Action</th>
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
                <button class="btn-toggle" [class.deactivate]="user.active" type="button" (click)="toggle(user)">
                  {{ user.active ? 'Désactiver' : 'Activer' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #emptyUsers>
          <div class="empty-state">
            <strong>Aucun utilisateur trouvé.</strong>
            <p>Les comptes créés apparaîtront ici.</p>
          </div>
        </ng-template>
      </div>
    </section>
  `,
  styles: [
    `
      .users-page {
        max-width: 1120px;
        margin: 0 auto;
        display: grid;
        gap: 1.6rem;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        gap: 1.5rem;
        align-items: end;
      }

      .eyebrow {
        color: var(--brand-orange-dark);
        font-size: 0.76rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin-bottom: 0.4rem;
      }

      h1 {
        font-size: 2.2rem;
        line-height: 1.15;
      }

      .subtitle {
        color: var(--text-secondary);
        line-height: 1.65;
      }

      .error {
        color: var(--danger);
        background: var(--danger-soft);
        border: 1px solid rgba(194, 65, 61, 0.22);
        border-radius: var(--radius-md);
        padding: 0.85rem 1rem;
        font-weight: 800;
      }

      .table-card {
        background: #fff;
        border-radius: var(--radius-md);
        border: 1px solid var(--line);
        box-shadow: var(--shadow-sm);
        overflow: hidden;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
      }

      th {
        background: var(--surface-soft);
        padding: 0.95rem 1.1rem;
        color: var(--text-muted);
        font-size: 0.76rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      td {
        padding: 1rem 1.1rem;
        border-top: 1px solid var(--line);
        vertical-align: middle;
      }

      .user-cell {
        display: flex;
        align-items: center;
        gap: 0.85rem;
      }

      .avatar {
        width: 40px;
        height: 40px;
        background: var(--brand-blue-soft);
        color: var(--brand-blue);
        border-radius: var(--radius-md);
        display: grid;
        place-items: center;
        font-weight: 900;
      }

      .details {
        min-width: 0;
      }

      .details strong {
        display: block;
        color: var(--text-primary);
      }

      .details span {
        color: var(--text-secondary);
        font-size: 0.88rem;
      }

      .roles-list {
        display: flex;
        gap: 0.45rem;
        flex-wrap: wrap;
      }

      .role-badge {
        background: var(--surface-soft);
        color: var(--text-secondary);
        padding: 0.25rem 0.55rem;
        border-radius: var(--radius-sm);
        font-size: 0.74rem;
        font-weight: 900;
      }

      .status-indicator {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        color: var(--danger);
        font-weight: 900;
      }

      .status-indicator.active {
        color: var(--success);
      }

      .status-indicator::before {
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
      }

      .actions-col {
        text-align: right;
      }

      .btn-toggle {
        min-height: 38px;
        background: var(--brand-blue);
        color: #fff;
        border: 0;
        padding: 0.55rem 0.85rem;
        border-radius: var(--radius-md);
        font-weight: 900;
        cursor: pointer;
      }

      .btn-toggle.deactivate {
        background: var(--danger-soft);
        color: var(--danger);
      }

      .empty-state {
        padding: 1.4rem;
      }

      .empty-state p {
        color: var(--text-secondary);
        margin-top: 0.35rem;
      }

      @media (max-width: 760px) {
        .page-header {
          display: grid;
          align-items: start;
        }

        h1 {
          font-size: 1.8rem;
        }

        th:nth-child(2),
        td:nth-child(2) {
          display: none;
        }

        td,
        th {
          padding: 0.85rem;
        }
      }
    `
  ]
})
export class UsersPage implements OnInit {
  readonly users = signal<UserSummary[]>([]);
  readonly error = signal('');

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.users().subscribe({
      next: (res: UserSummary[]) => this.users.set(res),
      error: () => this.error.set('Impossible de charger les utilisateurs.')
    });
  }

  toggle(user: UserSummary): void {
    this.api.setUserActive(user.id, !user.active).subscribe({
      next: () => this.load(),
      error: () => this.error.set("Impossible de modifier l'état de ce compte.")
    });
  }
}
