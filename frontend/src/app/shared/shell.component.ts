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
        <h1>Support Desk</h1>
        <nav>
          <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/tickets" routerLinkActive="active">Tickets</a>
          <a routerLink="/knowledge" routerLinkActive="active">FAQ</a>
          <a routerLink="/chatbot" routerLinkActive="active">Chatbot</a>
          <a routerLink="/users" routerLinkActive="active">Utilisateurs</a>
        </nav>
        <button class="logout" (click)="logout()">Se deconnecter</button>
      </aside>

      <main>
        <header>
          <div>
            <strong>{{ auth.currentUser()?.fullName }}</strong>
            <span>{{ auth.currentUser()?.roles?.join(', ') }}</span>
          </div>
          <button class="notif" (click)="reloadNotifications()">Notifications ({{ notifications().length }})</button>
        </header>

        <div class="notif-list" *ngIf="notifications().length">
          <article *ngFor="let n of notifications()">
            <strong>{{ n.title }}</strong>
            <p>{{ n.message }}</p>
          </article>
        </div>

        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      .layout {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 260px 1fr;
      }
      aside {
        background: #0d2538;
        color: #fff;
        padding: 1.25rem;
        position: sticky;
        top: 0;
        height: 100vh;
      }
      nav {
        margin-top: 1rem;
        display: grid;
        gap: 0.4rem;
      }
      nav a {
        color: #d7e5f3;
        text-decoration: none;
        padding: 0.6rem 0.75rem;
        border-radius: 8px;
      }
      nav a.active, nav a:hover {
        background: rgba(255, 255, 255, 0.16);
        color: #fff;
      }
      .logout {
        margin-top: 1rem;
        border: 0;
        background: #7a1f1f;
        color: #fff;
        padding: 0.55rem 0.8rem;
        border-radius: 8px;
      }
      main {
        padding: 1.4rem;
      }
      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      header span {
        display: block;
        font-size: 0.85rem;
        color: #546173;
      }
      .notif {
        border: 1px solid #b9cad9;
        background: #fff;
        border-radius: 8px;
        padding: 0.45rem 0.7rem;
      }
      .notif-list {
        margin-bottom: 1rem;
        display: grid;
        gap: 0.6rem;
      }
      .notif-list article {
        background: #eef5fb;
        border-left: 4px solid #0b4a6b;
        border-radius: 8px;
        padding: 0.6rem 0.8rem;
      }
      .notif-list p {
        margin: 0.25rem 0 0;
        color: #4f5f6f;
      }
      @media (max-width: 940px) {
        .layout {
          grid-template-columns: 1fr;
        }
        aside {
          position: static;
          height: auto;
        }
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
