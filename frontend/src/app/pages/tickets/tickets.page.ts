import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Ticket, TicketStatus } from '../../core/models';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-tickets-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="tickets-page">
      <div class="page-header">
        <h2>{{ auth.hasAnyRole(['CLIENT']) ? 'Envoyer un ticket' : 'Gestion des tickets' }}</h2>
        <p class="subtitle" *ngIf="auth.hasAnyRole(['CLIENT'])">
          Décrivez votre problème ou votre demande et nos agents vous répondront dans les plus brefs délais.
        </p>
      </div>

      <!-- Creation form: Visible to Clients, and also to Admin/Agent if needed (but following user request strictly) -->
      <form class="new-ticket" [formGroup]="form" (ngSubmit)="create()" *ngIf="auth.hasAnyRole(['CLIENT'])">
        <div class="form-header">
          <div class="icon">✏️</div>
          <h3>Nouveau Ticket</h3>
        </div>
        
        <div class="field">
          <label>Titre de la demande</label>
          <input formControlName="title" placeholder="Ex: Problème de connexion internet" />
        </div>

        <div class="field">
          <label>Description détaillée</label>
          <textarea formControlName="description" rows="4" placeholder="Veuillez décrire votre problème en détail..."></textarea>
        </div>

        <div class="form-grid">
          <div class="field">
            <label>Type</label>
            <select formControlName="type">
              <option value="INCIDENT">Incident</option>
              <option value="DEMANDE">Demande</option>
            </select>
          </div>
          <div class="field">
            <label>Catégorie</label>
            <select formControlName="category">
              <option value="MATERIEL">Matériel</option>
              <option value="LOGICIEL">Logiciel</option>
              <option value="RESEAU">Réseau</option>
              <option value="ACCES">Accès</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>
          <div class="field">
            <label>Priorité</label>
            <select formControlName="priority">
              <option value="FAIBLE">Faible</option>
              <option value="MOYENNE">Moyenne</option>
              <option value="ELEVEE">Élevée</option>
              <option value="CRITIQUE">Critique</option>
            </select>
          </div>
        </div>
        
        <div class="form-footer">
          <button type="submit" class="btn-submit" [disabled]="form.invalid">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Envoyer le ticket
          </button>
        </div>
      </form>

      <!-- List of tickets: ONLY for Admin, Agent, Superviseur -->
      <div class="tickets-list" *ngIf="auth.hasAnyRole(['ADMIN', 'AGENT', 'SUPERVISEUR'])">
        <div class="list-header">
          <h3>Tous les tickets</h3>
          <span class="count">{{ tickets().length }} tickets au total</span>
        </div>

        <div class="empty-state" *ngIf="tickets().length === 0">
          <p>Aucun ticket à afficher.</p>
        </div>

        <article class="ticket-card" *ngFor="let ticket of tickets()">
          <div class="ticket-main">
            <header>
              <div class="title-row">
                <span class="id">#{{ ticket.id }}</span>
                <h3>{{ ticket.title }}</h3>
              </div>
              <span class="status-badge" [attr.data-status]="ticket.status">{{ ticket.status }}</span>
            </header>
            
            <p class="desc">{{ ticket.description }}</p>
            
            <div class="ticket-meta">
              <div class="meta-item">
                <strong>Priorité</strong>
                <span class="priority-val" [attr.data-priority]="ticket.priority">{{ ticket.priority }}</span>
              </div>
              <div class="meta-item">
                <strong>Catégorie</strong>
                <span>{{ ticket.category }}</span>
              </div>
              <div class="meta-item">
                <strong>Client</strong>
                <span>{{ ticket.client.fullName }}</span>
              </div>
              <div class="meta-item">
                <strong>Agent</strong>
                <span class="agent-tag">{{ ticket.agent?.fullName || 'Non assigné' }}</span>
              </div>
            </div>
          </div>

          <div class="ticket-actions" *ngIf="auth.hasAnyRole(['ADMIN', 'AGENT', 'SUPERVISEUR'])">
            <div class="status-change">
              <select #statusSel>
                <option *ngFor="let s of statuses" [value]="s" [selected]="s === ticket.status">{{ s }}</option>
              </select>
              <button (click)="changeStatus(ticket.id, statusSel.value)" class="btn-update">Mettre à jour</button>
            </div>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [
    `
      .tickets-page {
        max-width: 1000px;
        margin: 0 auto;
        display: grid;
        gap: 2rem;
      }
      .page-header h2 { font-size: 2rem; color: #0f172a; margin-bottom: 0.5rem; }
      .page-header .subtitle { color: #64748b; font-size: 1.1rem; }

      .new-ticket {
        background: #fff;
        border-radius: 20px;
        padding: 2rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
        border: 1px solid #f1f5f9;
      }
      .form-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
      .form-header .icon { font-size: 1.5rem; width: 48px; height: 48px; background: var(--brand-blue-light); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
      .form-header h3 { font-size: 1.25rem; color: #1e293b; }

      .field { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }
      .field label { font-weight: 700; font-size: 0.9rem; color: #475569; }
      input, textarea, select {
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        padding: 0.75rem 1rem;
        font-family: inherit;
        font-size: 1rem;
        transition: border-color 0.2s;
      }
      input:focus, textarea:focus, select:focus { outline: none; border-color: var(--brand-blue); }
      
      .form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
      
      .form-footer { margin-top: 1rem; display: flex; justify-content: flex-end; }
      .btn-submit {
        background: var(--brand-blue);
        color: #fff;
        border: none;
        padding: 0.85rem 2rem;
        border-radius: 12px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
      }
      .btn-submit:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 89, 163, 0.3); }
      .btn-submit:disabled { background: #cbd5e1; cursor: not-allowed; transform: none; box-shadow: none; }

      .tickets-list { display: grid; gap: 1.5rem; }
      .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
      .list-header h3 { font-size: 1.25rem; color: #1e293b; }
      .list-header .count { font-size: 0.9rem; color: #64748b; font-weight: 600; }

      .ticket-card {
        background: #fff;
        border-radius: 20px;
        padding: 1.5rem;
        border: 1px solid #f1f5f9;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        transition: transform 0.2s;
      }
      .ticket-card:hover { border-color: var(--brand-blue-light); }
      
      .ticket-main header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
      .title-row { display: flex; align-items: center; gap: 0.75rem; }
      .title-row .id { font-weight: 800; color: var(--brand-blue); background: var(--brand-blue-light); padding: 0.25rem 0.6rem; border-radius: 8px; font-size: 0.85rem; }
      .title-row h3 { font-size: 1.1rem; color: #1e293b; margin: 0; }
      
      .status-badge {
        padding: 0.35rem 0.75rem;
        border-radius: 100px;
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.02em;
      }
      .status-badge[data-status="OUVERT"] { background: #dcfce7; color: #15803d; }
      .status-badge[data-status="EN_COURS"] { background: #dbeafe; color: #1d4ed8; }
      .status-badge[data-status="EN_ATTENTE"] { background: #fef9c3; color: #a16207; }
      .status-badge[data-status="RESOLU"] { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
      .status-badge[data-status="FERME"] { background: #f1f5f9; color: #475569; }

      .desc { color: #64748b; line-height: 1.5; margin-bottom: 1.5rem; }

      .ticket-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; padding-top: 1.5rem; border-top: 1px solid #f1f5f9; }
      .meta-item { display: flex; flex-direction: column; gap: 0.25rem; }
      .meta-item strong { font-size: 0.75rem; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; }
      .meta-item span { font-weight: 600; color: #334155; font-size: 0.95rem; }
      .priority-val[data-priority="CRITIQUE"] { color: #ef4444; }
      .priority-val[data-priority="ELEVEE"] { color: #f97316; }
      .agent-tag { color: var(--brand-blue) !important; }

      .ticket-actions { display: flex; justify-content: flex-end; padding-top: 1rem; border-top: 1px dotted #f1f5f9; }
      .status-change { display: flex; gap: 0.5rem; }
      .status-change select { padding: 0.5rem; font-size: 0.9rem; border-radius: 8px; }
      .btn-update { background: #f1f5f9; color: #1e293b; border: none; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer; }
      .btn-update:hover { background: #e2e8f0; }

      @media (max-width: 768px) {
        .form-grid { grid-template-columns: 1fr; }
        .ticket-meta { grid-template-columns: 1fr 1fr; }
      }
    `
  ]
})
export class TicketsPage implements OnInit {
  readonly tickets = signal<Ticket[]>([]);
  readonly statuses: TicketStatus[] = ['OUVERT', 'EN_COURS', 'EN_ATTENTE', 'RESOLU', 'FERME'];

  readonly form;

  constructor(
    private readonly api: ApiService,
    private readonly fb: FormBuilder,
    readonly auth: AuthService
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      type: ['INCIDENT', Validators.required],
      category: ['LOGICIEL', Validators.required],
      priority: ['MOYENNE', Validators.required],
      attachmentUrl: ['']
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.api.tickets().subscribe((res: Ticket[]) => this.tickets.set(res));
  }

  create() {
    if (this.form.invalid) {
      return;
    }
    this.api.createTicket(this.form.getRawValue() as any).subscribe(() => {
      this.form.patchValue({ title: '', description: '' });
      this.load();
    });
  }

  changeStatus(id: number, value: string) {
    this.api.changeTicketStatus(id, value as TicketStatus).subscribe(() => this.load());
  }

  rate(id: number, score: number) {
    this.api.rateTicket(id, score).subscribe(() => this.load());
  }
}
