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
    <div class="layout">
      <aside>
        <div class="brand">
          <img src="/image.png" alt="Topnet" class="logo" />
          <div class="brand-text">
            <strong>Support</strong>
            <span>Topnet</span>
          </div>
        </div>

        <nav>
          <a routerLink="/app/dashboard" routerLinkActive="active" *ngIf="auth.hasAnyRole(['ADMIN', 'SUPERVISEUR', 'AGENT', 'CLIENT'])">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Dashboard
          </a>
          <a routerLink="/app/tickets" routerLinkActive="active" *ngIf="auth.hasAnyRole(['ADMIN', 'SUPERVISEUR', 'AGENT', 'CLIENT'])">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 17.5a2.5 2.5 0 0 1 2.5-2.5H20a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H4.5A2.5 2.5 0 0 1 2 18.5v-1Z"/><path d="M16 11.5a4.5 4.5 0 0 0-4.5-4.5H4.5A2.5 2.5 0 0 0 2 9.5v1.5a2.5 2.5 0 0 0 2.5 2.5H11"/><path d="M16 5V2"/></svg>
            Tickets
          </a>
          <a routerLink="/app/knowledge" routerLinkActive="active" *ngIf="auth.hasAnyRole(['ADMIN', 'SUPERVISEUR', 'AGENT', 'CLIENT'])">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            Base de connaissances
          </a>
          <a routerLink="/app/chatbot" routerLinkActive="active" *ngIf="auth.hasAnyRole(['ADMIN', 'SUPERVISEUR', 'AGENT', 'CLIENT'])">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12"/><circle cx="17" cy="7" r="5"/></svg>
            Assistant IA
          </a>
          <a routerLink="/app/users" routerLinkActive="active" *ngIf="auth.hasAnyRole(['ADMIN', 'SUPERVISEUR'])">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Utilisateurs
          </a>
        </nav>

        <div class="aside-footer">
          <button class="logout-btn" (click)="logout()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Déconnexion
          </button>
        </div>
      </aside>

      <main>
        <header>
          <div class="user-info">
            <div class="avatar">{{ auth.currentUser()?.fullName?.charAt(0) }}</div>
            <div>
              <strong>{{ auth.currentUser()?.fullName }}</strong>
              <span>{{ auth.currentUser()?.roles?.join(', ') }}</span>
            </div>
          </div>
          <div class="actions">
            <button class="notif-btn" (click)="reloadNotifications()">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span class="badge" *ngIf="notifications().length">{{ notifications().length }}</span>
            </button>
          </div>
        </header>

        <div class="notif-panel" *ngIf="notifications().length">
          <div class="notif-header">
            <h3>Notifications récentes</h3>
            <button (click)="notifications.set([])">Tout marquer comme lu</button>
          </div>
          <div class="notif-scroll">
            <article *ngFor="let n of notifications()">
              <div class="notif-icon">🔔</div>
              <div class="notif-content">
                <strong>{{ n.title }}</strong>
                <p>{{ n.message }}</p>
              </div>
            </article>
          </div>
        </div>

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
        grid-template-columns: 280px 1fr;
        background: #f8fafc;
      }
      aside {
        background: #002d51;
        color: #fff;
        padding: 2rem 1.5rem;
        display: flex;
        flex-direction: column;
        position: sticky;
        top: 0;
        height: 100vh;
        border-right: 1px solid rgba(255, 255, 255, 0.1);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 3rem;
      }
      .logo {
        height: 36px;
        width: auto;
      }
      .brand-text {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }
      .brand-text strong { font-size: 1.1rem; color: #fff; }
      .brand-text span { font-size: 0.9rem; color: var(--brand-orange); font-weight: 700; }

      nav {
        display: grid;
        gap: 0.5rem;
        flex: 1;
      }
      nav a {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: #94a3b8;
        text-decoration: none;
        padding: 0.85rem 1rem;
        border-radius: 12px;
        font-weight: 600;
        transition: all 0.2s;
      }
      nav a:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #fff;
      }
      nav a.active {
        background: var(--brand-blue);
        color: #fff;
        box-shadow: 0 4px 12px rgba(0, 89, 163, 0.3);
      }
      
      .aside-footer {
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      .logout-btn {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #f87171;
        padding: 0.75rem 1rem;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .logout-btn:hover {
        background: rgba(248, 113, 113, 0.1);
        border-color: #f87171;
      }

      main {
        padding: 0;
        display: flex;
        flex-direction: column;
      }
      header {
        background: #fff;
        padding: 1rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #e2e8f0;
      }
      .user-info {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .avatar {
        width: 40px;
        height: 40px;
        background: var(--brand-blue-light);
        color: var(--brand-blue);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 1.2rem;
      }
      .user-info strong { display: block; color: #1e293b; }
      .user-info span { font-size: 0.8rem; color: #64748b; font-weight: 600; text-transform: uppercase; }

      .notif-btn {
        background: #f1f5f9;
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #64748b;
        cursor: pointer;
        position: relative;
        transition: all 0.2s;
      }
      .notif-btn:hover { background: #e2e8f0; color: #1e293b; }
      .notif-btn .badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #ef4444;
        color: #fff;
        font-size: 0.7rem;
        padding: 2px 6px;
        border-radius: 100px;
        border: 2px solid #fff;
      }

      .notif-panel {
        position: absolute;
        top: 70px;
        right: 20px;
        width: 360px;
        background: #fff;
        border-radius: 20px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        z-index: 100;
        border: 1px solid #e2e8f0;
        overflow: hidden;
      }
      .notif-header {
        padding: 1.25rem;
        border-bottom: 1px solid #f1f5f9;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .notif-header h3 { font-size: 1rem; color: #1e293b; }
      .notif-header button { background: none; border: none; color: var(--brand-blue); font-size: 0.85rem; font-weight: 600; cursor: pointer; }
      
      .notif-scroll { max-height: 400px; overflow-y: auto; }
      .notif-scroll article {
        padding: 1rem 1.25rem;
        display: flex;
        gap: 1rem;
        border-bottom: 1px solid #f1f5f9;
        transition: background 0.2s;
        cursor: pointer;
      }
      .notif-scroll article:hover { background: #f8fafc; }
      .notif-icon { width: 32px; height: 32px; background: var(--brand-blue-light); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem; }
      .notif-content strong { display: block; font-size: 0.9rem; color: #1e293b; margin-bottom: 0.25rem; }
      .notif-content p { font-size: 0.85rem; color: #64748b; line-height: 1.4; }

      .page-content {
        padding: 2rem;
        flex: 1;
        overflow-y: auto;
      }

      @media (max-width: 1024px) {
        .layout { grid-template-columns: 1fr; }
        aside { position: fixed; left: -100%; transition: left 0.3s; z-index: 200; }
        aside.open { left: 0; }
      }
    `
  ]
})
export class ShellComponent implements OnInit {
  readonly notifications = signal<NotificationView[]>([]);

  constructor(readonly auth: AuthService, private readonly api: ApiService) {}

  ngOnInit(): void {
    this.reloadNotifications();
  }

  reloadNotifications() {
    this.api.notifications().subscribe({
      next: (res) => this.notifications.set(res.slice(0, 5)),
      error: () => this.notifications.set([])
    });
  }

  logout() {
    this.auth.logout();
  }
}
