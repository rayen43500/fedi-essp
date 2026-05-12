import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Ticket, TicketCategory, TicketPriority, TicketStatus, TicketType } from '../../core/models';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-tickets-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <section class="tickets-page">
      <div class="page-header">
        <div>
          <p class="eyebrow">{{ auth.hasAnyRole(['CLIENT']) ? 'Demande client' : 'Support opérationnel' }}</p>
          <h1>{{ auth.hasAnyRole(['CLIENT']) ? 'Créer et suivre mes tickets' : 'Gestion des tickets' }}</h1>
        </div>
        <p class="subtitle">
          {{ auth.hasAnyRole(['CLIENT'])
            ? "Décrivez clairement votre besoin : plus le contexte est précis, plus la réponse sera rapide."
            : "Traitez les priorités, mettez les statuts à jour et gardez l'historique visible." }}
        </p>
      </div>

      <form class="new-ticket" [formGroup]="form" (ngSubmit)="create()" *ngIf="auth.hasAnyRole(['CLIENT'])">
        <div class="form-header">
          <span class="form-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          </span>
          <div>
            <h2>Nouveau ticket</h2>
            <p>Un titre court, une description utile et la bonne priorité suffisent.</p>
          </div>
        </div>

        <div class="field">
          <label for="ticket-title">Titre de la demande</label>
          <input id="ticket-title" formControlName="title" placeholder="Ex. Connexion internet instable" />
        </div>

        <div class="field">
          <label for="ticket-description">Description détaillée</label>
          <textarea id="ticket-description" formControlName="description" rows="5" placeholder="Expliquez le contexte, le moment d'apparition et les tests déjà faits."></textarea>
        </div>

        <div class="form-grid">
          <div class="field">
            <label for="ticket-type">Type</label>
            <select id="ticket-type" formControlName="type">
              <option *ngFor="let item of types" [value]="item">{{ typeLabel(item) }}</option>
            </select>
          </div>
          <div class="field">
            <label for="ticket-category">Catégorie</label>
            <select id="ticket-category" formControlName="category">
              <option *ngFor="let item of categories" [value]="item">{{ categoryLabel(item) }}</option>
            </select>
          </div>
          <div class="field">
            <label for="ticket-priority">Priorité</label>
            <select id="ticket-priority" formControlName="priority">
              <option *ngFor="let item of priorities" [value]="item">{{ priorityLabel(item) }}</option>
            </select>
          </div>
        </div>

        <div class="form-footer">
          <button type="submit" class="btn-submit" [disabled]="form.invalid || saving()">
            <span>{{ saving() ? 'Envoi en cours...' : 'Envoyer le ticket' }}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7Z"/></svg>
          </button>
        </div>
      </form>

      <p class="notice" *ngIf="notice()">{{ notice() }}</p>
      <p class="error" *ngIf="error()">{{ error() }}</p>

      <div class="tickets-list">
        <div class="list-header">
          <div>
            <p class="eyebrow">Suivi</p>
            <h2>{{ auth.hasAnyRole(['CLIENT']) ? 'Mes tickets' : 'Tous les tickets' }}</h2>
          </div>
          <span class="count">{{ tickets().length }} ticket{{ tickets().length > 1 ? 's' : '' }}</span>
        </div>

        <div class="empty-state" *ngIf="tickets().length === 0">
          <strong>Aucun ticket pour le moment.</strong>
          <p>{{ auth.hasAnyRole(['CLIENT']) ? 'Votre prochain ticket apparaîtra ici après création.' : 'La file support est vide.' }}</p>
        </div>

        <article class="ticket-card" *ngFor="let ticket of tickets()">
          <div class="ticket-top">
            <div>
              <span class="id">#{{ ticket.id }}</span>
              <h3>{{ ticket.title }}</h3>
            </div>
            <span class="status-badge" [attr.data-status]="ticket.status">{{ statusLabel(ticket.status) }}</span>
          </div>

          <p class="desc">{{ ticket.description }}</p>

          <dl class="ticket-meta">
            <div>
              <dt>Priorité</dt>
              <dd class="priority-val" [attr.data-priority]="ticket.priority">{{ priorityLabel(ticket.priority) }}</dd>
            </div>
            <div>
              <dt>Catégorie</dt>
              <dd>{{ categoryLabel(ticket.category) }}</dd>
            </div>
            <div>
              <dt>Client</dt>
              <dd>{{ ticket.client.fullName }}</dd>
            </div>
            <div>
              <dt>Agent</dt>
              <dd>{{ ticket.agent?.fullName || 'Non assigné' }}</dd>
            </div>
            <div>
              <dt>SLA</dt>
              <dd>{{ ticket.slaDeadline | date:'dd/MM/yyyy HH:mm' }}</dd>
            </div>
          </dl>

          <div class="comments" *ngIf="ticket.comments.length">
            <h4>Échanges</h4>
            <article *ngFor="let comment of ticket.comments">
              <strong>{{ comment.author }}</strong>
              <p>{{ comment.message }}</p>
            </article>
          </div>

          <div class="ticket-actions">
            <form class="comment-form" (ngSubmit)="addComment(ticket.id)">
              <input [(ngModel)]="commentDrafts[ticket.id]" [name]="'comment-' + ticket.id" placeholder="Ajouter un commentaire..." />
              <button type="submit" [disabled]="!commentDrafts[ticket.id]?.trim()">Commenter</button>
            </form>

            <div class="staff-actions" *ngIf="auth.hasAnyRole(['ADMIN', 'AGENT', 'SUPERVISEUR'])">
              <select #statusSel aria-label="Changer le statut">
                <option *ngFor="let s of statuses" [value]="s" [selected]="s === ticket.status">{{ statusLabel(s) }}</option>
              </select>
              <button type="button" (click)="changeStatus(ticket.id, statusSel.value)">Mettre à jour</button>
            </div>

            <div class="rating" *ngIf="auth.hasAnyRole(['CLIENT']) && (ticket.status === 'RESOLU' || ticket.status === 'FERME')">
              <span>Votre note</span>
              <button type="button" *ngFor="let score of scoreOptions" [class.selected]="ticket.satisfactionScore === score" (click)="rate(ticket.id, score)">
                {{ score }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [
    `
      .tickets-page {
        max-width: 1120px;
        margin: 0 auto;
        display: grid;
        gap: 1.6rem;
      }

      .page-header,
      .list-header {
        display: flex;
        justify-content: space-between;
        gap: 1.5rem;
        align-items: end;
      }

      .eyebrow {
        color: var(--brand-orange-dark);
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-size: 0.76rem;
        margin-bottom: 0.4rem;
      }

      h1 {
        font-size: 2.2rem;
        line-height: 1.15;
      }

      .subtitle {
        max-width: 460px;
        color: var(--text-secondary);
        line-height: 1.65;
      }

      .new-ticket,
      .ticket-card,
      .empty-state {
        background: #fff;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
      }

      .new-ticket {
        padding: 1.3rem;
        display: grid;
        gap: 1rem;
      }

      .form-header {
        display: flex;
        gap: 1rem;
        align-items: center;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--line);
      }

      .form-icon {
        width: 46px;
        height: 46px;
        display: grid;
        place-items: center;
        color: var(--brand-blue);
        background: var(--brand-blue-soft);
        border-radius: var(--radius-md);
      }

      .form-header h2,
      .list-header h2 {
        font-size: 1.2rem;
      }

      .form-header p {
        color: var(--text-secondary);
        margin-top: 0.2rem;
      }

      .field {
        display: grid;
        gap: 0.45rem;
      }

      .field label {
        color: var(--text-primary);
        font-size: 0.88rem;
        font-weight: 900;
      }

      input,
      textarea,
      select {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        padding: 0.76rem 0.9rem;
        background: #fff;
        color: var(--text-primary);
      }

      textarea {
        resize: vertical;
      }

      input:focus,
      textarea:focus,
      select:focus {
        outline: none;
        border-color: var(--brand-blue);
        box-shadow: 0 0 0 4px rgba(0, 89, 163, 0.10);
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
      }

      .form-footer {
        display: flex;
        justify-content: flex-end;
      }

      .btn-submit,
      .comment-form button,
      .staff-actions button,
      .rating button {
        border: 0;
        border-radius: var(--radius-md);
        font-weight: 900;
        cursor: pointer;
      }

      .btn-submit {
        min-height: 42px;
        display: inline-flex;
        align-items: center;
        gap: 0.65rem;
        background: var(--brand-blue);
        color: #fff;
        padding: 0.75rem 1.05rem;
      }

      .btn-submit:disabled,
      .comment-form button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
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
        background: var(--danger-soft);
        color: var(--danger);
        border: 1px solid rgba(194, 65, 61, 0.22);
      }

      .tickets-list {
        display: grid;
        gap: 1rem;
      }

      .count {
        color: var(--text-muted);
        font-weight: 900;
      }

      .empty-state {
        padding: 1.4rem;
      }

      .empty-state strong {
        display: block;
        margin-bottom: 0.3rem;
      }

      .empty-state p {
        color: var(--text-secondary);
      }

      .ticket-card {
        padding: 1.2rem;
        display: grid;
        gap: 1rem;
      }

      .ticket-top {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: start;
      }

      .id {
        display: inline-flex;
        color: var(--brand-blue);
        background: var(--brand-blue-soft);
        border-radius: var(--radius-sm);
        padding: 0.22rem 0.5rem;
        font-size: 0.78rem;
        font-weight: 900;
        margin-bottom: 0.55rem;
      }

      .ticket-top h3 {
        font-size: 1.15rem;
        line-height: 1.3;
      }

      .status-badge {
        white-space: nowrap;
        border-radius: 999px;
        padding: 0.35rem 0.72rem;
        font-size: 0.76rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .status-badge[data-status="OUVERT"] {
        background: var(--brand-orange-soft);
        color: var(--brand-orange-dark);
      }

      .status-badge[data-status="EN_COURS"] {
        background: var(--brand-blue-soft);
        color: var(--brand-blue);
      }

      .status-badge[data-status="EN_ATTENTE"] {
        background: var(--warning-soft);
        color: var(--warning);
      }

      .status-badge[data-status="RESOLU"] {
        background: var(--success-soft);
        color: var(--success);
      }

      .status-badge[data-status="FERME"] {
        background: var(--surface-soft);
        color: var(--text-secondary);
      }

      .desc {
        color: var(--text-secondary);
        line-height: 1.58;
      }

      .ticket-meta {
        display: grid;
        grid-template-columns: repeat(5, minmax(120px, 1fr));
        gap: 0.8rem;
        padding-top: 1rem;
        border-top: 1px solid var(--line);
      }

      .ticket-meta div {
        display: grid;
        gap: 0.2rem;
      }

      dt {
        color: var(--text-muted);
        font-size: 0.72rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      dd {
        color: var(--text-primary);
        font-weight: 800;
      }

      .priority-val[data-priority="CRITIQUE"] {
        color: var(--danger);
      }

      .priority-val[data-priority="ELEVEE"] {
        color: var(--brand-orange-dark);
      }

      .comments {
        display: grid;
        gap: 0.6rem;
        padding: 1rem;
        background: var(--surface-soft);
        border-radius: var(--radius-md);
      }

      .comments h4 {
        font-size: 0.9rem;
      }

      .comments article {
        padding: 0.75rem;
        background: #fff;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
      }

      .comments strong {
        display: block;
        margin-bottom: 0.25rem;
        font-size: 0.86rem;
      }

      .comments p {
        color: var(--text-secondary);
      }

      .ticket-actions {
        display: grid;
        gap: 0.8rem;
        padding-top: 1rem;
        border-top: 1px solid var(--line);
      }

      .comment-form,
      .staff-actions,
      .rating {
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }

      .comment-form {
        width: 100%;
      }

      .comment-form input {
        flex: 1;
      }

      .comment-form button,
      .staff-actions button {
        min-height: 40px;
        padding: 0.65rem 0.9rem;
        background: var(--brand-blue);
        color: #fff;
      }

      .staff-actions select {
        max-width: 180px;
      }

      .rating {
        flex-wrap: wrap;
      }

      .rating span {
        color: var(--text-muted);
        font-size: 0.82rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .rating button {
        width: 34px;
        height: 34px;
        background: #fff;
        border: 1px solid var(--line);
        color: var(--text-secondary);
      }

      .rating button.selected {
        background: var(--brand-orange);
        border-color: var(--brand-orange);
        color: #fff;
      }

      @media (max-width: 880px) {
        .page-header,
        .list-header {
          display: grid;
          align-items: start;
        }

        .form-grid,
        .ticket-meta {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 620px) {
        h1 {
          font-size: 1.75rem;
        }

        .form-grid,
        .ticket-meta {
          grid-template-columns: 1fr;
        }

        .ticket-top,
        .comment-form,
        .staff-actions {
          display: grid;
        }

        .staff-actions select {
          max-width: none;
        }
      }
    `
  ]
})
export class TicketsPage implements OnInit {
  readonly tickets = signal<Ticket[]>([]);
  readonly saving = signal(false);
  readonly notice = signal('');
  readonly error = signal('');

  readonly statuses: TicketStatus[] = ['OUVERT', 'EN_COURS', 'EN_ATTENTE', 'RESOLU', 'FERME'];
  readonly types: TicketType[] = ['INCIDENT', 'DEMANDE'];
  readonly categories: TicketCategory[] = ['MATERIEL', 'LOGICIEL', 'RESEAU', 'ACCES', 'AUTRE'];
  readonly priorities: TicketPriority[] = ['FAIBLE', 'MOYENNE', 'ELEVEE', 'CRITIQUE'];
  readonly scoreOptions = [1, 2, 3, 4, 5];
  readonly commentDrafts: Record<number, string | undefined> = {};

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

  load(): void {
    this.api.tickets().subscribe({
      next: (res: Ticket[]) => this.tickets.set(res),
      error: () => this.error.set("Impossible de charger les tickets.")
    });
  }

  create(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.notice.set('');
    this.error.set('');

    this.api.createTicket(this.form.getRawValue() as any).subscribe({
      next: () => {
        this.saving.set(false);
        this.notice.set('Ticket envoyé. Il apparaît maintenant dans votre suivi.');
        this.form.reset({
          title: '',
          description: '',
          type: 'INCIDENT',
          category: 'LOGICIEL',
          priority: 'MOYENNE',
          attachmentUrl: ''
        });
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.error.set("Le ticket n'a pas pu être envoyé.");
      }
    });
  }

  changeStatus(id: number, value: string): void {
    this.api.changeTicketStatus(id, value as TicketStatus).subscribe({
      next: () => {
        this.notice.set('Statut mis à jour.');
        this.load();
      },
      error: () => this.error.set("Impossible de mettre le statut à jour.")
    });
  }

  addComment(id: number): void {
    const message = this.commentDrafts[id]?.trim();
    if (!message) {
      return;
    }

    this.api.addComment(id, message).subscribe({
      next: () => {
        this.commentDrafts[id] = '';
        this.load();
      },
      error: () => this.error.set("Le commentaire n'a pas pu être ajouté.")
    });
  }

  rate(id: number, score: number): void {
    this.api.rateTicket(id, score).subscribe({
      next: () => {
        this.notice.set('Merci, votre note est enregistrée.');
        this.load();
      },
      error: () => this.error.set("La note n'a pas pu être enregistrée.")
    });
  }

  statusLabel(status: TicketStatus): string {
    const labels: Record<TicketStatus, string> = {
      OUVERT: 'Ouvert',
      EN_COURS: 'En cours',
      EN_ATTENTE: 'En attente',
      RESOLU: 'Résolu',
      FERME: 'Fermé'
    };
    return labels[status];
  }

  priorityLabel(priority: TicketPriority): string {
    const labels: Record<TicketPriority, string> = {
      FAIBLE: 'Faible',
      MOYENNE: 'Moyenne',
      ELEVEE: 'Élevée',
      CRITIQUE: 'Critique'
    };
    return labels[priority];
  }

  categoryLabel(category: TicketCategory): string {
    const labels: Record<TicketCategory, string> = {
      MATERIEL: 'Matériel',
      LOGICIEL: 'Logiciel',
      RESEAU: 'Réseau',
      ACCES: 'Accès',
      AUTRE: 'Autre'
    };
    return labels[category];
  }

  typeLabel(type: TicketType): string {
    return type === 'INCIDENT' ? 'Incident' : 'Demande';
  }
}
