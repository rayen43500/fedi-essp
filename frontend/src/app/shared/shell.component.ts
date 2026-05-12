import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';
import { NotificationView } from '../core/models';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout" [class.menu-open]="menuOpen()">
      <button class="backdrop" type="button" aria-label="Fermer le menu" (click)="closeMenu()"></button>

      <aside>
        <div class="brand">
          <img src="/image.png" alt="Topnet" class="logo" />
          <div class="brand-text">
            <strong>Support Desk</strong>
            <span>Topnet</span>
          </div>
        </div>

        <nav aria-label="Navigation principale">
          <a routerLink="/app/dashboard" routerLinkActive="active" (click)="closeMenu()" *ngIf="auth.hasAnyRole(['ADMIN', 'SUPERVISEUR', 'AGENT', 'CLIENT'])">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
            Tableau de bord
          </a>
          <a routerLink="/app/tickets" routerLinkActive="active" (click)="closeMenu()" *ngIf="auth.hasAnyRole(['ADMIN', 'SUPERVISEUR', 'AGENT', 'CLIENT'])">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v2a3 3 0 0 0 0 6v2a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-2a3 3 0 0 0 0-6V7Z"/><path d="M9 9h6M9 15h4"/></svg>
            Tickets
          </a>
          <a routerLink="/app/knowledge" routerLinkActive="active" (click)="closeMenu()" *ngIf="auth.hasAnyRole(['ADMIN', 'SUPERVISEUR', 'AGENT', 'CLIENT'])">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            Guides
          </a>
          <a routerLink="/app/chatbot" routerLinkActive="active" (click)="closeMenu()" *ngIf="auth.hasAnyRole(['ADMIN', 'SUPERVISEUR', 'AGENT', 'CLIENT'])">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/><path d="M8 10h8M8 14h5"/></svg>
            Assistant support
          </a>
          <a routerLink="/app/users" routerLinkActive="active" (click)="closeMenu()" *ngIf="auth.hasAnyRole(['ADMIN', 'SUPERVISEUR'])">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Utilisateurs
          </a>
        </nav>

        <div class="aside-note">
          <span>Priorité</span>
          <strong>SLA et tickets critiques visibles en premier.</strong>
        </div>

        <button class="logout-btn" type="button" (click)="logout()">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>
          Déconnexion
        </button>
      </aside>

      <main>
        <header>
          <div class="header-left">
            <button class="menu-btn" type="button" aria-label="Ouvrir le menu" (click)="menuOpen.set(true)">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <div class="page-kicker">
              <span>Espace sécurisé</span>
              <strong>Support Topnet</strong>
            </div>
          </div>

          <div class="header-actions">
            <button class="notif-btn" type="button" aria-label="Voir les notifications" (click)="toggleNotifications()">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span class="badge" *ngIf="notifications().length">{{ notifications().length }}</span>
            </button>

            <div class="user-info">
              <div class="avatar">{{ userInitial() }}</div>
              <div>
                <strong>{{ auth.currentUser()?.fullName }}</strong>
                <span>{{ auth.currentUser()?.roles?.join(', ') }}</span>
              </div>
            </div>
          </div>
        </header>

        <section class="notif-panel" *ngIf="notificationsOpen()">
          <div class="notif-header">
            <div>
              <span>Notifications</span>
              <h3>{{ notifications().length ? 'À traiter' : 'Aucune alerte' }}</h3>
            </div>
            <button type="button" (click)="markAllRead()" [disabled]="!notifications().length">Tout lire</button>
          </div>
          <div class="notif-scroll" *ngIf="notifications().length; else emptyNotifications">
            <article *ngFor="let n of notifications()">
              <div class="notif-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v5l3 2"/><circle cx="12" cy="12" r="9"/></svg>
              </div>
              <div class="notif-content">
                <strong>{{ n.title }}</strong>
                <p>{{ n.message }}</p>
              </div>
            </article>
          </div>
          <ng-template #emptyNotifications>
            <p class="notif-empty">Tout est à jour.</p>
          </ng-template>
        </section>

        <div class="page-content">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .layout {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 272px minmax(0, 1fr);
        background: var(--bg-app);
      }

      aside {
        background: #082b49;
        color: #fff;
        padding: 1.4rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        position: sticky;
        top: 0;
        height: 100vh;
        border-right: 1px solid rgba(255, 255, 255, 0.12);
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        padding: 0.45rem 0.25rem 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      }

      .logo {
        height: 34px;
        width: auto;
        object-fit: contain;
      }

      .brand-text {
        display: grid;
        line-height: 1.15;
      }

      .brand-text strong {
        font-family: 'Sora', sans-serif;
        font-size: 1rem;
      }

      .brand-text span {
        color: #ffae72;
        font-size: 0.82rem;
        font-weight: 800;
      }

      nav {
        display: grid;
        gap: 0.35rem;
        flex: 1;
      }

      nav a {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-height: 44px;
        color: #bdd0e0;
        text-decoration: none;
        padding: 0.72rem 0.78rem;
        border-radius: var(--radius-md);
        font-weight: 800;
        transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
      }

      nav a:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
      }

      nav a.active {
        background: #ffffff;
        color: var(--brand-blue-dark);
        box-shadow: var(--shadow-sm);
      }

      .aside-note {
        display: grid;
        gap: 0.25rem;
        padding: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: var(--radius-md);
        background: rgba(255, 255, 255, 0.06);
      }

      .aside-note span {
        color: #ffbc88;
        font-size: 0.72rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .aside-note strong {
        font-size: 0.86rem;
        line-height: 1.35;
      }

      .logout-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.65rem;
        min-height: 42px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.16);
        color: #ffd4d2;
        padding: 0.72rem 1rem;
        border-radius: var(--radius-md);
        font-weight: 800;
        cursor: pointer;
      }

      .logout-btn:hover {
        background: rgba(194, 65, 61, 0.18);
      }

      main {
        min-width: 0;
        position: relative;
        display: flex;
        flex-direction: column;
      }

      header {
        position: sticky;
        top: 0;
        z-index: 50;
        background: rgba(251, 252, 254, 0.92);
        backdrop-filter: blur(14px);
        min-height: 72px;
        padding: 0 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--line);
      }

      .header-left,
      .header-actions,
      .user-info {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .menu-btn,
      .notif-btn {
        width: 42px;
        height: 42px;
        border-radius: var(--radius-md);
        border: 1px solid var(--line);
        background: #fff;
        color: var(--text-primary);
        display: none;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }

      .notif-btn {
        display: flex;
        position: relative;
      }

      .notif-btn:hover,
      .menu-btn:hover {
        border-color: var(--line-strong);
        background: var(--surface-soft);
      }

      .badge {
        position: absolute;
        top: -5px;
        right: -5px;
        min-width: 20px;
        height: 20px;
        display: grid;
        place-items: center;
        background: var(--brand-orange);
        color: #fff;
        font-size: 0.72rem;
        font-weight: 900;
        border-radius: 999px;
        border: 2px solid #fff;
      }

      .page-kicker {
        display: grid;
        line-height: 1.2;
      }

      .page-kicker span,
      .user-info span {
        color: var(--text-muted);
        font-size: 0.75rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .page-kicker strong,
      .user-info strong {
        color: var(--text-primary);
        font-weight: 900;
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

      .notif-panel {
        position: fixed;
        top: 84px;
        right: 24px;
        width: min(390px, calc(100vw - 32px));
        background: #fff;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-md);
        z-index: 90;
        border: 1px solid var(--line);
        overflow: hidden;
      }

      .notif-header {
        padding: 1rem;
        border-bottom: 1px solid var(--line);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
      }

      .notif-header span {
        display: block;
        color: var(--text-muted);
        font-size: 0.72rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .notif-header h3 {
        font-size: 1rem;
        color: var(--text-primary);
      }

      .notif-header button {
        border: 1px solid var(--line);
        background: var(--surface-soft);
        color: var(--brand-blue);
        border-radius: var(--radius-sm);
        padding: 0.5rem 0.75rem;
        font-size: 0.82rem;
        font-weight: 900;
        cursor: pointer;
      }

      .notif-header button:disabled {
        color: var(--text-muted);
        cursor: not-allowed;
      }

      .notif-scroll {
        max-height: 390px;
        overflow-y: auto;
      }

      .notif-scroll article {
        padding: 1rem;
        display: flex;
        gap: 0.8rem;
        border-bottom: 1px solid var(--line);
      }

      .notif-scroll article:last-child {
        border-bottom: 0;
      }

      .notif-icon {
        width: 34px;
        height: 34px;
        color: var(--brand-blue);
        background: var(--brand-blue-soft);
        border-radius: var(--radius-sm);
        display: grid;
        place-items: center;
        flex: 0 0 auto;
      }

      .notif-content strong {
        display: block;
        font-size: 0.92rem;
        margin-bottom: 0.22rem;
      }

      .notif-content p,
      .notif-empty {
        color: var(--text-secondary);
        font-size: 0.9rem;
        line-height: 1.45;
      }

      .notif-empty {
        padding: 1rem;
      }

      .page-content {
        padding: 2rem;
        flex: 1;
      }

      .backdrop {
        display: none;
      }

      @media (max-width: 980px) {
        .layout {
          grid-template-columns: 1fr;
        }

        aside {
          position: fixed;
          z-index: 120;
          width: min(292px, calc(100vw - 42px));
          transform: translateX(-105%);
          transition: transform 0.22s ease;
        }

        .layout.menu-open aside {
          transform: translateX(0);
        }

        .layout.menu-open .backdrop {
          display: block;
          position: fixed;
          inset: 0;
          z-index: 110;
          border: 0;
          background: rgba(7, 19, 32, 0.45);
        }

        .menu-btn {
          display: flex;
        }
      }

      @media (max-width: 700px) {
        header {
          padding: 0 1rem;
        }

        .page-kicker {
          display: none;
        }

        .user-info div:last-child {
          display: none;
        }

        .page-content {
          padding: 1.1rem;
        }
      }
    `
  ]
})
export class ShellComponent implements OnInit {
  readonly notifications = signal<NotificationView[]>([]);
  readonly notificationsOpen = signal(false);
  readonly menuOpen = signal(false);

  constructor(readonly auth: AuthService, private readonly api: ApiService) {}

  ngOnInit(): void {
    this.reloadNotifications();
  }

  userInitial(): string {
    return this.auth.currentUser()?.fullName?.trim().charAt(0).toUpperCase() || 'U';
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  toggleNotifications(): void {
    this.notificationsOpen.update((open) => !open);
    if (!this.notificationsOpen()) {
      return;
    }
    this.reloadNotifications();
  }

  reloadNotifications(): void {
    this.api.notifications().subscribe({
      next: (res) => this.notifications.set(res.slice(0, 6)),
      error: () => this.notifications.set([])
    });
  }

  markAllRead(): void {
    const current = this.notifications();
    this.notifications.set([]);
    this.notificationsOpen.set(false);
    current.forEach((item) => {
      this.api.markNotificationRead(item.id).subscribe({ error: () => undefined });
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
