import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { ApiService } from '../../core/api.service';
import { DashboardCharts, DashboardStats, Ticket } from '../../core/models';
import { AuthService } from '../../core/auth.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="dashboard">
      <div class="welcome-header">
        <div>
          <p class="eyebrow">{{ spaceLabel() }}</p>
          <h1>{{ auth.hasAnyRole(['CLIENT']) ? 'Mon espace support personnel' : 'Vue opérationnelle du support' }}</h1>
          <p class="user-email" *ngIf="auth.currentUser() as u">{{ u.fullName }} · {{ u.email }}</p>
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
          <span class="stat-icon danger">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>
          </span>
          <div>
            <span>SLA dépassé</span>
            <strong>{{ s.overdueTickets }}</strong>
          </div>
        </article>

        <article class="stat-card">
          <span class="stat-icon danger">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h5"/></svg>
          </span>
          <div>
            <span>Critiques</span>
            <strong>{{ s.criticalTickets }}</strong>
          </div>
        </article>

        <article class="stat-card">
          <span class="stat-icon neutral">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>
          </span>
          <div>
            <span>Non assignés</span>
            <strong>{{ s.unassignedTickets }}</strong>
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

      <div class="charts-panel" *ngIf="auth.hasAnyRole(['ADMIN', 'AGENT', 'SUPERVISEUR'])">
        <article class="chart-card">
          <h2>Répartition par statut</h2>
          <div class="chart-host">
            <canvas #statusChart></canvas>
            <p class="chart-empty" *ngIf="chartsEmpty()">Aucun ticket pour afficher le graphique.</p>
          </div>
        </article>
        <article class="chart-card">
          <h2>Répartition par priorité</h2>
          <div class="chart-host">
            <canvas #priorityChart></canvas>
            <p class="chart-empty" *ngIf="chartsEmpty()">Aucun ticket pour afficher le graphique.</p>
          </div>
        </article>
      </div>

      <div class="charts-panel client-charts" *ngIf="auth.hasAnyRole(['CLIENT'])">
        <article class="chart-card">
          <h2>Mes tickets par statut</h2>
          <div class="chart-host">
            <canvas #clientStatusChart></canvas>
            <p class="chart-empty" *ngIf="chartsEmpty()">Créez un ticket pour voir vos statistiques.</p>
          </div>
        </article>
        <article class="chart-card">
          <h2>Mes tickets par priorité</h2>
          <div class="chart-host">
            <canvas #clientPriorityChart></canvas>
            <p class="chart-empty" *ngIf="chartsEmpty()">Créez un ticket pour voir vos statistiques.</p>
          </div>
        </article>
      </div>

      <div class="insight-panel" *ngIf="auth.hasAnyRole(['ADMIN', 'AGENT', 'SUPERVISEUR']) && stats() as s">
        <div>
          <span class="panel-label">Temps moyen de résolution</span>
          <strong>{{ s.averageResolutionHours | number:'1.0-1' }} h</strong>
        </div>
        <p>
          {{ s.overdueTickets }} ticket{{ s.overdueTickets > 1 ? 's' : '' }} en retard,
          {{ s.unassignedTickets }} non assigné{{ s.unassignedTickets > 1 ? 's' : '' }} et
          {{ s.archivedTickets }} archivé{{ s.archivedTickets > 1 ? 's' : '' }}.
        </p>
        <a routerLink="/app/tickets">Voir les tickets</a>
      </div>

      <div class="client-summary" *ngIf="auth.hasAnyRole(['CLIENT'])">
        <article>
          <span>Mes tickets</span>
          <strong>{{ clientTickets().length }}</strong>
        </article>
        <article>
          <span>En cours</span>
          <strong>{{ clientActiveTickets() }}</strong>
        </article>
        <article>
          <span>SLA a surveiller</span>
          <strong>{{ clientLateTickets() }}</strong>
        </article>
        <article>
          <span>Notes envoyees</span>
          <strong>{{ clientRatedTickets() }}</strong>
        </article>
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
          <h2>Base de connaissances</h2>
          <p>Retrouvez des réponses simples pour les problèmes fréquents avant d’attendre un agent.</p>
          <a routerLink="/app/knowledge" class="btn secondary">Consulter les guides</a>
        </article>

        <article>
          <span class="action-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/></svg>
          </span>
          <h2>Assistant IA</h2>
          <p>Décrivez votre problème : l’IA peut répondre et créer un ticket à votre place.</p>
          <a routerLink="/app/chatbot" class="btn secondary">Parler à l’assistant</a>
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

      .user-email {
        margin-top: 0.45rem;
        color: var(--text-muted);
        font-size: 0.9rem;
        font-weight: 700;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: 1rem;
      }

      .stat-card,
      .client-summary article,
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

      .danger {
        background: var(--danger-soft);
        color: var(--danger);
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

      .charts-panel {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1rem;
      }

      .chart-card {
        background: #fff;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
        padding: 1.1rem;
        display: grid;
        gap: 0.75rem;
      }

      .chart-card h2 {
        font-size: 1rem;
      }

      .chart-host {
        position: relative;
        min-height: 260px;
        width: 100%;
      }

      .chart-host canvas {
        width: 100% !important;
        height: 260px !important;
        display: block;
      }

      .chart-empty {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        text-align: center;
        padding: 1rem;
        color: var(--text-muted);
        font-weight: 700;
        font-size: 0.9rem;
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

      .client-summary {
        display: grid;
        grid-template-columns: repeat(4, minmax(130px, 1fr));
        gap: 1rem;
      }

      .client-summary article {
        padding: 1rem;
      }

      .client-summary span {
        display: block;
        color: var(--text-muted);
        font-size: 0.74rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .client-summary strong {
        display: block;
        margin-top: 0.25rem;
        font-family: 'Sora', sans-serif;
        font-size: 1.45rem;
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

        .client-summary {
          grid-template-columns: 1fr 1fr;
        }

        h1 {
          font-size: 1.9rem;
        }
      }
    `
  ]
})
export class DashboardPage implements OnInit, AfterViewInit {
  @ViewChild('statusChart') statusChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('priorityChart') priorityChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('clientStatusChart') clientStatusChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('clientPriorityChart') clientPriorityChartRef?: ElementRef<HTMLCanvasElement>;

  readonly stats = signal<DashboardStats | null>(null);
  readonly charts = signal<DashboardCharts | null>(null);
  readonly clientTickets = signal<Ticket[]>([]);
  readonly error = signal('');

  private statusChart?: Chart;
  private priorityChart?: Chart;
  private clientStatusChart?: Chart;
  private clientPriorityChart?: Chart;
  readonly clientActiveTickets = computed(() =>
    this.clientTickets().filter((ticket) => ticket.status === 'OUVERT' || ticket.status === 'EN_COURS' || ticket.status === 'EN_ATTENTE').length
  );
  readonly clientLateTickets = computed(() =>
    this.clientTickets().filter((ticket) =>
      (ticket.status === 'OUVERT' || ticket.status === 'EN_COURS' || ticket.status === 'EN_ATTENTE')
      && new Date(ticket.slaDeadline).getTime() < Date.now()
    ).length
  );
  readonly clientRatedTickets = computed(() => this.clientTickets().filter((ticket) => ticket.satisfactionScore).length);

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
      this.api.dashboardCharts().subscribe({
        next: (res: DashboardCharts) => {
          this.charts.set(res);
          this.scheduleStaffCharts();
        }
      });
    }
    if (this.auth.hasAnyRole(['CLIENT'])) {
      this.api.tickets().subscribe({
        next: (res: Ticket[]) => this.clientTickets.set(res),
        error: () => this.error.set("Impossible de charger vos tickets pour le moment.")
      });
      this.api.myDashboardCharts().subscribe({
        next: (res: DashboardCharts) => {
          this.charts.set(res);
          this.scheduleClientCharts();
        }
      });
    }
  }

  ngAfterViewInit(): void {
    if (this.auth.hasAnyRole(['ADMIN', 'AGENT', 'SUPERVISEUR'])) {
      this.scheduleStaffCharts();
    }
    if (this.auth.hasAnyRole(['CLIENT'])) {
      this.scheduleClientCharts();
    }
  }

  spaceLabel(): string {
    if (this.auth.hasAnyRole(['CLIENT'])) {
      return 'Mon espace client';
    }
    if (this.auth.hasAnyRole(['AGENT'])) {
      return 'Espace agent';
    }
    if (this.auth.hasAnyRole(['SUPERVISEUR'])) {
      return 'Espace superviseur';
    }
    return 'Espace administrateur';
  }

  chartsEmpty(): boolean {
    const data = this.charts();
    if (!data) {
      return true;
    }
    const total = data.ticketsByStatus.reduce((sum, s) => sum + s.value, 0);
    return total === 0;
  }

  firstName(): string {
    return this.auth.currentUser()?.fullName?.split(' ')[0] || '';
  }

  private scheduleStaffCharts(): void {
    setTimeout(() => {
      const data = this.charts();
      if (data) {
        this.renderCharts(data, 'staff');
      }
    }, 80);
  }

  private scheduleClientCharts(): void {
    setTimeout(() => {
      const data = this.charts();
      if (data) {
        this.renderCharts(data, 'client');
      }
    }, 80);
  }

  private renderCharts(data: DashboardCharts, target: 'staff' | 'client'): void {
    const statusCanvas = target === 'staff'
      ? this.statusChartRef?.nativeElement
      : this.clientStatusChartRef?.nativeElement;
    const priorityCanvas = target === 'staff'
      ? this.priorityChartRef?.nativeElement
      : this.clientPriorityChartRef?.nativeElement;
    if (!statusCanvas || !priorityCanvas) {
      return;
    }

    if (target === 'staff') {
      this.statusChart?.destroy();
      this.priorityChart?.destroy();
    } else {
      this.clientStatusChart?.destroy();
      this.clientPriorityChart?.destroy();
    }

    const statusChart = new Chart(statusCanvas, {
      type: 'doughnut',
      data: {
        labels: data.ticketsByStatus.map((s) => s.label),
        datasets: [{
          data: data.ticketsByStatus.map((s) => s.value),
          backgroundColor: ['#0059a3', '#f28c28', '#c9a227', '#188754', '#6c757d']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });

    const priorityChart = new Chart(priorityCanvas, {
      type: 'bar',
      data: {
        labels: data.ticketsByPriority.map((s) => s.label),
        datasets: [{
          label: 'Tickets',
          data: data.ticketsByPriority.map((s) => s.value),
          backgroundColor: ['#c2413d', '#f28c28', '#0059a3', '#188754']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });

    if (target === 'staff') {
      this.statusChart = statusChart;
      this.priorityChart = priorityChart;
    } else {
      this.clientStatusChart = statusChart;
      this.clientPriorityChart = priorityChart;
    }
  }
}
