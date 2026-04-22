import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { DashboardStats } from '../../core/models';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="dashboard">
      <div class="welcome-header">
        <h1>Bonjour, {{ auth.currentUser()?.fullName }} 👋</h1>
        <p class="subtitle">
          {{ auth.hasAnyRole(['CLIENT']) 
            ? "Bienvenue sur votre portail support Topnet. Comment pouvons-nous vous aider aujourd'hui ?" 
            : "Voici un aperçu de l'état actuel du support technique." }}
        </p>
      </div>

      <!-- Stats Grid for Admin/Agent -->
      <div class="stats-grid" *ngIf="auth.hasAnyRole(['ADMIN', 'AGENT', 'SUPERVISEUR']) && stats() as s">
        <article class="stat-card blue">
          <div class="stat-icon">🎟️</div>
          <div class="stat-content">
            <span>Total Tickets</span>
            <strong>{{ s.totalTickets }}</strong>
          </div>
        </article>
        
        <article class="stat-card orange">
          <div class="stat-icon">⚡</div>
          <div class="stat-content">
            <span>Ouverts</span>
            <strong>{{ s.openTickets }}</strong>
          </div>
        </article>

        <article class="stat-card yellow">
          <div class="stat-icon">⏳</div>
          <div class="stat-content">
            <span>En attente</span>
            <strong>{{ s.waitingTickets }}</strong>
          </div>
        </article>

        <article class="stat-card green">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <span>Résolus</span>
            <strong>{{ s.resolvedTickets }}</strong>
          </div>
        </article>
        
        <article class="stat-card info">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <span>Satisfaction</span>
            <strong>{{ s.customerSatisfactionRate | number:'1.1-1' }}/5</strong>
          </div>
        </article>

        <article class="stat-card info">
          <div class="stat-icon">🕒</div>
          <div class="stat-content">
            <span>Temps Moyen (h)</span>
            <strong>{{ s.averageResolutionHours | number:'1.0-1' }}h</strong>
          </div>
        </article>
      </div>

      <!-- Client View -->
      <div class="client-actions" *ngIf="auth.hasAnyRole(['CLIENT'])">
        <article class="action-card">
          <div class="icon">➕</div>
          <h3>Créer un nouveau ticket</h3>
          <p>Vous avez un problème technique ou une demande ? Ouvrez un ticket maintenant.</p>
          <a routerLink="/app/tickets" class="btn">Ouvrir un ticket</a>
        </article>
        
        <article class="action-card">
          <div class="icon">📖</div>
          <h3>Base de connaissances</h3>
          <p>Consultez nos guides et FAQ pour trouver des solutions rapides par vous-même.</p>
          <a routerLink="/app/knowledge" class="btn secondary">Voir les guides</a>
        </article>

        <article class="action-card">
          <div class="icon">🤖</div>
          <h3>Assistant IA</h3>
          <p>Discutez avec notre assistant intelligent pour une aide instantanée.</p>
          <a routerLink="/app/chatbot" class="btn secondary">Lancer le chat</a>
        </article>
      </div>
    </section>
  `,
  styles: [
    `
      .dashboard { display: grid; gap: 2.5rem; }
      .welcome-header h1 { font-size: 2.2rem; color: #0f172a; margin-bottom: 0.5rem; }
      .welcome-header .subtitle { color: #64748b; font-size: 1.1rem; }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1.5rem;
      }
      .stat-card {
        background: #fff;
        padding: 1.5rem;
        border-radius: 24px;
        display: flex;
        align-items: center;
        gap: 1.25rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.03);
        border: 1px solid #f1f5f9;
        transition: transform 0.2s;
      }
      .stat-card:hover { transform: translateY(-5px); }
      .stat-icon {
        width: 54px;
        height: 54px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
      }
      .stat-card.blue .stat-icon { background: #eff6ff; }
      .stat-card.orange .stat-icon { background: #fff7ed; }
      .stat-card.yellow .stat-icon { background: #fefce8; }
      .stat-card.green .stat-icon { background: #f0fdf4; }
      .stat-card.info .stat-icon { background: #f8fafc; }

      .stat-content span { color: #64748b; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 0.25rem; }
      .stat-content strong { font-size: 1.75rem; color: #1e293b; font-family: 'Sora', sans-serif; }

      .client-actions {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 2rem;
      }
      .action-card {
        background: #fff;
        padding: 2rem;
        border-radius: 24px;
        text-align: center;
        border: 1px solid #f1f5f9;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.03);
      }
      .action-card .icon { font-size: 2.5rem; margin-bottom: 1rem; }
      .action-card h3 { font-size: 1.25rem; color: #1e293b; margin-bottom: 1rem; }
      .action-card p { color: #64748b; margin-bottom: 2rem; line-height: 1.5; }
      .btn {
        display: inline-block;
        padding: 0.75rem 1.5rem;
        background: var(--brand-blue);
        color: #fff;
        text-decoration: none;
        border-radius: 12px;
        font-weight: 700;
        transition: all 0.2s;
      }
      .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 89, 163, 0.3); }
      .btn.secondary { background: #f1f5f9; color: #1e293b; }
      .btn.secondary:hover { background: #e2e8f0; }

      @media (max-width: 640px) {
        .welcome-header h1 { font-size: 1.75rem; }
      }
    `
  ]
})
export class DashboardPage implements OnInit {
  readonly stats = signal<DashboardStats | null>(null);

  constructor(
    private readonly api: ApiService,
    readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    if (this.auth.hasAnyRole(['ADMIN', 'AGENT', 'SUPERVISEUR'])) {
      this.api.dashboardStats().subscribe((res: DashboardStats) => this.stats.set(res));
    }
  }
}
