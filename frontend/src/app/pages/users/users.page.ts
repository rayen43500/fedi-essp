import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Role, UserSummary } from '../../core/models';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="users-page">
      <div class="page-header">
        <div>
          <p class="eyebrow">Administration</p>
          <h1>Utilisateurs</h1>
        </div>
        <p class="subtitle">Filtrez les comptes, controlez les acces et gardez au moins un administrateur actif.</p>
      </div>

      <p class="notice" *ngIf="notice()">{{ notice() }}</p>
      <p class="error" *ngIf="error()">{{ error() }}</p>

      <section class="filters-card">
        <div class="stats-strip">
          <article>
            <span>Total</span>
            <strong>{{ users().length }}</strong>
          </article>
          <article>
            <span>Actifs</span>
            <strong>{{ activeCount() }}</strong>
          </article>
          <article>
            <span>Support</span>
            <strong>{{ staffCount() }}</strong>
          </article>
          <article>
            <span>Clients</span>
            <strong>{{ clientCount() }}</strong>
          </article>
        </div>

        <div class="filters-grid">
          <div class="field search-field">
            <label for="user-search">Recherche</label>
            <input id="user-search" [value]="search()" (input)="search.set($any($event.target).value)" placeholder="Nom ou email..." />
          </div>
          <div class="field">
            <label for="role-filter">Role</label>
            <select id="role-filter" [value]="roleFilter()" (change)="roleFilter.set($any($event.target).value)">
              <option value="ALL">Tous</option>
              <option *ngFor="let role of roles" [value]="role">{{ roleLabel(role) }}</option>
            </select>
          </div>
          <div class="field">
            <label for="status-filter">Statut</label>
            <select id="status-filter" [value]="statusFilter()" (change)="statusFilter.set($any($event.target).value)">
              <option value="ALL">Tous</option>
              <option value="ACTIVE">Actifs</option>
              <option value="INACTIVE">Inactifs</option>
            </select>
          </div>
          <button type="button" class="btn-reset" (click)="resetFilters()">Reinitialiser</button>
        </div>
      </section>

      <div class="table-card">
        <table *ngIf="filteredUsers().length; else emptyUsers">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Roles</th>
              <th>Statut</th>
              <th>Creation</th>
              <th class="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of filteredUsers()">
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
                <div class="roles-editor" *ngIf="auth.hasAnyRole(['ADMIN']); else readonlyRoles">
                  <label *ngFor="let role of roles">
                    <input type="checkbox" [checked]="hasRole(user, role)" (change)="toggleRole(user, role, $any($event.target).checked)" />
                    {{ roleLabel(role) }}
                  </label>
                </div>
                <ng-template #readonlyRoles>
                  <div class="roles-list">
                    <span class="role-badge" *ngFor="let role of user.roles">{{ roleLabel(role) }}</span>
                  </div>
                </ng-template>
              </td>
              <td>
                <span class="status-indicator" [class.active]="user.active">
                  {{ user.active ? 'Actif' : 'Inactif' }}
                </span>
              </td>
              <td>
                <span class="date-value">{{ user.createdAt | date:'dd/MM/yyyy' }}</span>
              </td>
              <td class="actions-col">
                <button class="btn-toggle" [class.deactivate]="user.active" type="button" (click)="toggle(user)" *ngIf="auth.hasAnyRole(['ADMIN']); else readOnlyAction">
                  {{ user.active ? 'Desactiver' : 'Activer' }}
                </button>
                <ng-template #readOnlyAction>
                  <span class="readonly-label">Lecture</span>
                </ng-template>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #emptyUsers>
          <div class="empty-state">
            <strong>Aucun utilisateur trouve.</strong>
            <p>Modifiez les filtres pour elargir la recherche.</p>
          </div>
        </ng-template>
      </div>
    </section>
  `,
  styles: [
    `
      .users-page {
        max-width: 1180px;
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
        max-width: 520px;
        color: var(--text-secondary);
        line-height: 1.65;
      }

      .notice,
      .error {
        border-radius: var(--radius-md);
        padding: 0.85rem 1rem;
        font-weight: 800;
      }

      .notice {
        background: var(--success-soft);
        color: var(--success);
        border: 1px solid rgba(24, 135, 84, 0.22);
      }

      .error {
        color: var(--danger);
        background: var(--danger-soft);
        border: 1px solid rgba(194, 65, 61, 0.22);
      }

      .filters-card,
      .table-card {
        background: #fff;
        border-radius: var(--radius-md);
        border: 1px solid var(--line);
        box-shadow: var(--shadow-sm);
      }

      .filters-card {
        padding: 1.1rem;
        display: grid;
        gap: 1rem;
      }

      .stats-strip {
        display: grid;
        grid-template-columns: repeat(4, minmax(120px, 1fr));
        gap: 0.75rem;
      }

      .stats-strip article {
        background: var(--surface-soft);
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        padding: 0.9rem;
      }

      .stats-strip span {
        display: block;
        color: var(--text-muted);
        font-size: 0.72rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .stats-strip strong {
        display: block;
        margin-top: 0.2rem;
        font-family: 'Sora', sans-serif;
        font-size: 1.35rem;
      }

      .filters-grid {
        display: grid;
        grid-template-columns: minmax(240px, 1fr) 180px 180px auto;
        gap: 0.8rem;
        align-items: end;
      }

      .field {
        display: grid;
        gap: 0.45rem;
      }

      .field label {
        font-size: 0.86rem;
        font-weight: 900;
      }

      input,
      select {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: #fff;
        padding: 0.75rem 0.9rem;
        color: var(--text-primary);
      }

      input:focus,
      select:focus {
        outline: none;
        border-color: var(--brand-blue);
        box-shadow: 0 0 0 4px rgba(0, 89, 163, 0.10);
      }

      .btn-reset {
        min-height: 42px;
        border: 1px solid var(--line);
        background: var(--surface-soft);
        color: var(--brand-blue);
        padding: 0.6rem 0.85rem;
        border-radius: var(--radius-md);
        font-weight: 900;
        cursor: pointer;
      }

      .table-card {
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

      .roles-list,
      .roles-editor {
        display: flex;
        gap: 0.45rem;
        flex-wrap: wrap;
      }

      .roles-editor label {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        background: var(--surface-soft);
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        padding: 0.3rem 0.5rem;
        color: var(--text-secondary);
        font-size: 0.78rem;
        font-weight: 900;
      }

      .roles-editor input {
        width: auto;
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

      .date-value,
      .readonly-label {
        color: var(--text-secondary);
        font-weight: 800;
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

      @media (max-width: 980px) {
        .page-header,
        .filters-grid {
          display: grid;
          align-items: start;
        }

        .stats-strip {
          grid-template-columns: repeat(2, 1fr);
        }

        h1 {
          font-size: 1.8rem;
        }
      }

      @media (max-width: 760px) {
        th:nth-child(2),
        td:nth-child(2),
        th:nth-child(4),
        td:nth-child(4) {
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
  readonly notice = signal('');
  readonly search = signal('');
  readonly roleFilter = signal<Role | 'ALL'>('ALL');
  readonly statusFilter = signal<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  readonly roles: Role[] = ['CLIENT', 'AGENT', 'SUPERVISEUR', 'ADMIN'];

  readonly activeCount = computed(() => this.users().filter((user) => user.active).length);
  readonly clientCount = computed(() => this.users().filter((user) => user.roles.includes('CLIENT')).length);
  readonly staffCount = computed(() => this.users().filter((user) => this.isStaff(user)).length);
  readonly filteredUsers = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.users().filter((user) => {
      const matchesSearch = !query || user.fullName.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
      const matchesRole = this.roleFilter() === 'ALL' || user.roles.includes(this.roleFilter() as Role);
      const matchesStatus = this.statusFilter() === 'ALL'
        || (this.statusFilter() === 'ACTIVE' && user.active)
        || (this.statusFilter() === 'INACTIVE' && !user.active);
      return matchesSearch && matchesRole && matchesStatus;
    });
  });

  constructor(private readonly api: ApiService, readonly auth: AuthService) {}

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
    this.error.set('');
    this.notice.set('');
    this.api.setUserActive(user.id, !user.active).subscribe({
      next: () => {
        this.notice.set('Statut du compte mis a jour.');
        this.load();
      },
      error: () => this.error.set("Impossible de modifier l'etat de ce compte.")
    });
  }

  toggleRole(user: UserSummary, role: Role, checked: boolean): void {
    const roles = new Set(user.roles);
    if (checked) {
      roles.add(role);
    } else {
      roles.delete(role);
    }

    if (!roles.size) {
      this.error.set('Un utilisateur doit garder au moins un role.');
      this.load();
      return;
    }

    this.error.set('');
    this.notice.set('');
    this.api.updateUserRoles(user.id, Array.from(roles)).subscribe({
      next: () => {
        this.notice.set('Roles mis a jour.');
        this.load();
      },
      error: () => {
        this.error.set("Impossible de modifier les roles de cet utilisateur.");
        this.load();
      }
    });
  }

  resetFilters(): void {
    this.search.set('');
    this.roleFilter.set('ALL');
    this.statusFilter.set('ALL');
  }

  hasRole(user: UserSummary, role: Role): boolean {
    return user.roles.includes(role);
  }

  roleLabel(role: Role): string {
    const labels: Record<Role, string> = {
      CLIENT: 'Client',
      AGENT: 'Agent',
      SUPERVISEUR: 'Superviseur',
      ADMIN: 'Admin'
    };
    return labels[role];
  }

  private isStaff(user: UserSummary): boolean {
    return user.roles.includes('AGENT') || user.roles.includes('SUPERVISEUR') || user.roles.includes('ADMIN');
  }
}
