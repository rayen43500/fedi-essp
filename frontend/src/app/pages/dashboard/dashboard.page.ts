import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { DashboardStats } from '../../core/models';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section>
      <h2>Tableau de bord</h2>
      <p class="subtitle">Vue globale des performances du support.</p>

      <div class="grid" *ngIf="stats() as s">
        <article><span>Total tickets</span><strong>{{ s.totalTickets }}</strong></article>
        <article><span>Ouverts</span><strong>{{ s.openTickets }}</strong></article>
        <article><span>En cours</span><strong>{{ s.inProgressTickets }}</strong></article>
        <article><span>En attente</span><strong>{{ s.waitingTickets }}</strong></article>
        <article><span>Resolus</span><strong>{{ s.resolvedTickets }}</strong></article>
        <article><span>Fermes</span><strong>{{ s.closedTickets }}</strong></article>
        <article><span>Temps moyen (h)</span><strong>{{ s.averageResolutionHours | number:'1.0-1' }}</strong></article>
        <article><span>Satisfaction</span><strong>{{ s.customerSatisfactionRate | number:'1.1-2' }}/5</strong></article>
      </div>
    </section>
  `,
  styles: [
    `
      .subtitle { color: #546173; }
      .grid {
        margin-top: 1.2rem;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 0.9rem;
      }
      article {
        border-radius: 14px;
        padding: 1rem;
        background: #fff;
        box-shadow: 0 8px 18px rgba(8, 24, 40, 0.09);
      }
      span { color: #5a6778; font-size: 0.88rem; display: block; }
      strong { font-size: 1.4rem; color: #0d2438; }
    `
  ]
})
export class DashboardPage implements OnInit {
  readonly stats = signal<DashboardStats | null>(null);

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.api.dashboardStats().subscribe((res) => this.stats.set(res));
  }
}
