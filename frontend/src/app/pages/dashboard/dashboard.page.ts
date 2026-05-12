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
        <div>
          <p class="eyebrow">Bonjour {{ firstName() }}</p>
          <h1>{{ auth.hasAnyRole(['CLIENT']) ? 'Votre support en un seul endroit' : 'Vue opérationnelle du support' }}</h1>
        </div>
        <p class="subtitle">
          {{ auth.hasAnyRole(['CLIENT'])
            ? "Créez un ticket, suivez son avancement et retrouvez les guides utiles quand vous en avez besoin."
            : "Gardez le contrôle sur les volumes, les délais et les priorités sans chercher l'information." }}
        </p>
      </div>

      <div class="stats-grid" *ngIf="auth.hasAnyRole(['ADMIN', 'AGENT', 'SUPERVISEUR']) && stats() as s">
        <article class="stat-card">
          <span class="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v2a3 3 0 0 0 0 6v2a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-2a3 3 0 0 0 0-6V7Z"/></svg>
          </span>
          <div>
            <span>Total tickets</span>
            <strong>{{ s.totalTickets }}</strong>
          </div>
        </article>

        <article class="stat-card">
          <span class="stat-icon orange">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
          </span>
          <div>
            <span>Ouverts</span>
            <strong>{{ s.openTickets }}</strong>
          </div>
        </article>

        <article class="stat-card">
          <span class="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6"/></svg>
          </span>
          <div>
            <span>En cours</span>
            <strong>{{ s.inProgressTickets }}</strong>
          </div>
        </article>

        <article class="stat-card">
          <span class="stat-icon warning">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2h4"/><path d="M12 14v-4"/><path d="M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/></svg>
          </span>
          <div>
            <span>En attente</span>
            <strong>{{ s.waitingTickets }}</strong>
          </div>
        </article>

        <article class="stat-card">
          <span class="stat-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>
          </span>
          <div>
            <span>Résolus</span>
            <strong>{{ s.resolvedTickets }}</strong>
          </div>
        </article>

        <article class="stat-card">
          <span class="stat-icon neutral">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-4 4"/></svg>
          </span>
          <div>
            <span>Satisfaction</span>
            <strong>{{ s.customerSatisfactionRate | number:'1.1-1' }}/5</strong>
          </div>
        </article>
      </div>

      <div class="insight-panel" *ngIf="auth.hasAnyRole(['ADMIN', 'AGENT', 'SUPERVISEUR']) && stats() as s">
        <div>
          <span class="panel-label">Temps moyen de résolution</span>
          <strong>{{ s.averageResolutionHours | number:'1.0-1' }} h</strong>
        </div>
        <p>
          Les tickets ouverts et en attente doivent rester visibles : ce sont eux qui portent le plus de risque SLA.
        </p>
        <a routerLink="/app/tickets">Voir les tickets</a>
      </div>

      <div class="client-actions" *ngIf="auth.hasAnyRole(['CLIENT'])">
        <article>
          <span class="action-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          </span>
          <h2>Créer un ticket</h2>
          <p>Décrivez le problème, choisissez la priorité et laissez l’équipe support prendre le relais.</p>
          <a routerLink="/app/tickets" class="btn">Ouvrir un ticket</a>
        </article>

        <article>
          <span class="action-icon orange">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </span>
          <h2>Lire les guides</h2>
          <p>Retrouvez des réponses simples pour les problèmes fréquents avant d’attendre un agent.</p>
          <a routerLink="/app/knowledge" class="btn secondary">Voir les guides</a>
        </article>

        <article>
          <span class="action-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/></svg>
          </span>
          <h2>Demander de l’aide</h2>
          <p>L’assistant support propose une première réponse et des articles pertinents.</p>
          <a routerLink="/app/chatbot" class="btn secondary">Lancer le chat</a>
        </article>
      </div>

      <p class="error" *ngIf="error()">{{ error() }}</p>
    </section>
  `,
  styles: [
    `
      .dashboard {
        display: grid;
        gap: 1.6rem;
      }

      .welcome-header {
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(280px, 0.55fr);
        gap: 1.5rem;
        align-items: end;
      }

      .eyebrow {
        color: var(--brand-orange-dark);
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-size: 0.78rem;
        margin-bottom: 0.55rem;
      }

      h1 {
        max-width: 720px;
        font-size: 2.25rem;
        line-height: 1.12;
        color: var(--text-primary);
      }

      .subtitle {
        color: var(--text-secondary);
        font-size: 1rem;
        line-height: 1.65;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: 1rem;
      }

      .stat-card,
      .client-actions article,
      .insight-panel {
        background: #fff;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
      }

      .stat-card {
        padding: 1.15rem;
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .stat-icon,
      .action-icon {
        display: grid;
        place-items: center;
        border-radius: var(--radius-md);
        flex: 0 0 auto;
      }

      .stat-icon {
        width: 48px;
        height: 48px;
      }

      .blue {
        background: var(--brand-blue-soft);
        color: var(--brand-blue);
      }

      .orange {
        background: var(--brand-orange-soft);
        color: var(--brand-orange-dark);
      }

      .warning {
        background: var(--warning-soft);
        color: var(--warning);
      }

      .green {
        background: var(--success-soft);
        color: var(--success);
      }

      .neutral {
        background: var(--surface-soft);
        color: var(--text-secondary);
      }

      .stat-card span:not(.stat-icon) {
        display: block;
        color: var(--text-muted);
        font-size: 0.76rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .stat-card strong {
        display: block;
        margin-top: 0.2rem;
        font-family: 'Sora', sans-serif;
        font-size: 1.7rem;
      }

      .insight-panel {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 1.25rem;
        padding: 1.2rem;
      }

      .panel-label {
        display: block;
        color: var(--text-muted);
        font-size: 0.76rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .insight-panel strong {
        font-family: 'Sora', sans-serif;
        font-size: 1.45rem;
      }

      .insight-panel p {
        color: var(--text-secondary);
      }

      .insight-panel a,
      .btn {
        min-height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-md);
        font-weight: 900;
        text-decoration: none;
      }

      .insight-panel a {
        color: var(--brand-blue);
        padding: 0.55rem 0.8rem;
        background: var(--brand-blue-soft);
      }

      .client-actions {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 1rem;
      }

      .client-actions article {
        padding: 1.25rem;
        display: grid;
        gap: 0.9rem;
        align-content: start;
      }

      .action-icon {
        width: 46px;
        height: 46px;
      }

      .client-actions h2 {
        font-size: 1.15rem;
      }

      .client-actions p {
        color: var(--text-secondary);
        line-height: 1.55;
      }

      .btn {
        width: fit-content;
        padding: 0.68rem 1rem;
        background: var(--brand-blue);
        color: #fff;
      }

      .btn.secondary {
        background: var(--surface-soft);
        color: var(--brand-blue-dark);
      }

      .error {
        color: var(--danger);
        background: var(--danger-soft);
        border: 1px solid rgba(194, 65, 61, 0.22);
        border-radius: var(--radius-md);
        padding: 0.8rem 1rem;
      }

      @media (max-width: 820px) {
        .welcome-header,
        .insight-panel {
          grid-template-columns: 1fr;
          align-items: start;
        }

        h1 {
          font-size: 1.9rem;
        }
      }
    `
  ]
})
export class DashboardPage implements OnInit {
  readonly stats = signal<DashboardStats | null>(null);
  readonly error = signal('');

  constructor(
    private readonly api: ApiService,
    readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    if (this.auth.hasAnyRole(['ADMIN', 'AGENT', 'SUPERVISEUR'])) {
      this.api.dashboardStats().subscribe({
        next: (res: DashboardStats) => this.stats.set(res),
        error: () => this.error.set("Impossible de charger les indicateurs pour le moment.")
      });
    }
  }

  firstName(): string {
    return this.auth.currentUser()?.fullName?.split(' ')[0] || '';
  }
}
