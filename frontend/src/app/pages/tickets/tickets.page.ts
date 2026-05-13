import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, TicketFilters } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Ticket, TicketCategory, TicketPriority, TicketStatus, TicketType, UserSummary } from '../../core/models';

@Component({
  selector: 'app-tickets-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <section class="tickets-page">
      <div class="page-header">
        <div>
          <p class="eyebrow">{{ auth.hasAnyRole(['CLIENT']) ? 'Demande client' : 'Support operationnel' }}</p>
          <h1>{{ auth.hasAnyRole(['CLIENT']) ? 'Creer et suivre mes tickets' : 'Gestion des tickets' }}</h1>
        </div>
        <p class="subtitle">
          {{ auth.hasAnyRole(['CLIENT'])
            ? "Decrivez clairement votre besoin : plus le contexte est precis, plus la reponse sera rapide."
            : "Filtrez la file, assignez les dossiers et gardez les risques SLA visibles." }}
        </p>
      </div>

      <form class="new-ticket" [formGroup]="form" (ngSubmit)="create()" *ngIf="auth.hasAnyRole(['CLIENT'])">
        <div class="form-header">
          <span class="form-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          </span>
          <div>
            <h2>Nouveau ticket</h2>
            <p>Un titre court, une description utile et la bonne priorite suffisent.</p>
          </div>
        </div>

        <div class="field">
          <label for="ticket-title">Titre de la demande</label>
          <input id="ticket-title" formControlName="title" placeholder="Ex. Connexion internet instable" />
        </div>

        <div class="field">
          <label for="ticket-description">Description detaillee</label>
          <textarea id="ticket-description" formControlName="description" rows="5" placeholder="Expliquez le contexte, le moment d'apparition et les tests deja faits."></textarea>
        </div>

        <div class="form-grid">
          <div class="field">
            <label for="ticket-type">Type</label>
            <select id="ticket-type" formControlName="type">
              <option *ngFor="let item of types" [value]="item">{{ typeLabel(item) }}</option>
            </select>
          </div>
          <div class="field">
            <label for="ticket-category">Categorie</label>
            <select id="ticket-category" formControlName="category">
              <option *ngFor="let item of categories" [value]="item">{{ categoryLabel(item) }}</option>
            </select>
          </div>
          <div class="field">
            <label for="ticket-priority">Priorite</label>
            <select id="ticket-priority" formControlName="priority">
              <option *ngFor="let item of priorities" [value]="item">{{ priorityLabel(item) }}</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label for="ticket-attachment">Lien de piece jointe</label>
          <input id="ticket-attachment" formControlName="attachmentUrl" placeholder="https://... (optionnel)" />
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

      <section class="filter-card">
        <div class="filter-top">
          <div>
            <p class="eyebrow">Recherche et filtres</p>
            <h2>Prioriser la file</h2>
          </div>
          <div class="manager-actions" *ngIf="isManager()">
            <button type="button" class="btn-light" (click)="escalateSla()">Escalader SLA</button>
            <button type="button" class="btn-light danger" (click)="archiveClosed()">Archiver fermes</button>
          </div>
        </div>

        <div class="quick-stats">
          <button type="button" (click)="resetFilters()">
            <span>Total</span>
            <strong>{{ totalTickets() }}</strong>
          </button>
          <button type="button" (click)="setStatus('OUVERT')">
            <span>Ouverts</span>
            <strong>{{ openCount() }}</strong>
          </button>
          <button type="button" (click)="showOverdueOnly()">
            <span>SLA depasse</span>
            <strong>{{ overdueCount() }}</strong>
          </button>
          <button type="button" (click)="setPriority('CRITIQUE')">
            <span>Critiques</span>
            <strong>{{ criticalCount() }}</strong>
          </button>
          <button type="button" (click)="showUnassigned()" *ngIf="isStaff()">
            <span>Non assignes</span>
            <strong>{{ unassignedCount() }}</strong>
          </button>
        </div>

        <div class="filters-grid">
          <div class="field search-field">
            <label for="ticket-search">Recherche</label>
            <input id="ticket-search" [value]="search()" (input)="search.set($any($event.target).value)" (keyup.enter)="load()" placeholder="Titre, description, client, agent..." />
          </div>
          <div class="field">
            <label for="status-filter">Statut</label>
            <select id="status-filter" [value]="statusFilter()" (change)="statusFilter.set($any($event.target).value)">
              <option value="ALL">Tous</option>
              <option *ngFor="let s of statuses" [value]="s">{{ statusLabel(s) }}</option>
            </select>
          </div>
          <div class="field">
            <label for="priority-filter">Priorite</label>
            <select id="priority-filter" [value]="priorityFilter()" (change)="priorityFilter.set($any($event.target).value)">
              <option value="ALL">Toutes</option>
              <option *ngFor="let p of priorities" [value]="p">{{ priorityLabel(p) }}</option>
            </select>
          </div>
          <div class="field">
            <label for="category-filter">Categorie</label>
            <select id="category-filter" [value]="categoryFilter()" (change)="categoryFilter.set($any($event.target).value)">
              <option value="ALL">Toutes</option>
              <option *ngFor="let c of categories" [value]="c">{{ categoryLabel(c) }}</option>
            </select>
          </div>
          <div class="field">
            <label for="type-filter">Type</label>
            <select id="type-filter" [value]="typeFilter()" (change)="typeFilter.set($any($event.target).value)">
              <option value="ALL">Tous</option>
              <option *ngFor="let t of types" [value]="t">{{ typeLabel(t) }}</option>
            </select>
          </div>
          <div class="field" *ngIf="isStaff()">
            <label for="agent-filter">Agent</label>
            <select id="agent-filter" [value]="agentFilter()" (change)="agentFilter.set($any($event.target).value)">
              <option value="ALL">Tous</option>
              <option value="UNASSIGNED">Non assignes</option>
              <option *ngFor="let agent of agents()" [value]="agent.id">{{ agent.fullName }}</option>
            </select>
          </div>
        </div>

        <div class="filter-flags">
          <label *ngIf="isStaff()">
            <input type="checkbox" [checked]="assignedToMe()" (change)="assignedToMe.set($any($event.target).checked)" />
            Assignes a moi
          </label>
          <label>
            <input type="checkbox" [checked]="overdueOnly()" (change)="overdueOnly.set($any($event.target).checked)" />
            SLA depasse
          </label>
          <label *ngIf="isStaff()">
            <input type="checkbox" [checked]="mineOnly()" (change)="mineOnly.set($any($event.target).checked)" />
            Mes dossiers
          </label>
          <label *ngIf="isManager()">
            <input type="checkbox" [checked]="includeArchived()" (change)="includeArchived.set($any($event.target).checked)" />
            Inclure archives
          </label>
          <div class="filter-actions">
            <button type="button" class="btn-submit" (click)="load()">Appliquer</button>
            <button type="button" class="btn-reset" (click)="resetFilters()">Reinitialiser</button>
          </div>
        </div>
      </section>

      <div class="tickets-list">
        <div class="list-header">
          <div>
            <p class="eyebrow">Suivi</p>
            <h2>{{ auth.hasAnyRole(['CLIENT']) ? 'Mes tickets' : 'Tous les tickets' }}</h2>
          </div>
          <span class="count">{{ tickets().length }} ticket{{ tickets().length > 1 ? 's' : '' }}</span>
        </div>

        <div class="empty-state" *ngIf="tickets().length === 0">
          <strong>Aucun ticket pour ces criteres.</strong>
          <p>{{ auth.hasAnyRole(['CLIENT']) ? 'Ajustez les filtres ou creez une nouvelle demande.' : 'Aucun dossier ne correspond a cette vue.' }}</p>
        </div>

        <article class="ticket-card" *ngFor="let ticket of tickets()">
          <div class="ticket-top">
            <div>
              <div class="badges-line">
                <span class="id">#{{ ticket.id }}</span>
                <span class="archive-badge" *ngIf="ticket.archived">Archive</span>
                <span class="sla-badge" [attr.data-sla]="slaState(ticket)">{{ slaLabel(ticket) }}</span>
              </div>
              <h3>{{ ticket.title }}</h3>
            </div>
            <span class="status-badge" [attr.data-status]="ticket.status">{{ statusLabel(ticket.status) }}</span>
          </div>

          <p class="desc">{{ ticket.description }}</p>
          <a class="attachment-link" *ngIf="ticket.attachmentUrl" [href]="ticket.attachmentUrl" target="_blank" rel="noreferrer">
            Ouvrir la piece jointe
          </a>

          <dl class="ticket-meta">
            <div>
              <dt>Type</dt>
              <dd>{{ typeLabel(ticket.type) }}</dd>
            </div>
            <div>
              <dt>Priorite</dt>
              <dd class="priority-val" [attr.data-priority]="ticket.priority">{{ priorityLabel(ticket.priority) }}</dd>
            </div>
            <div>
              <dt>Categorie</dt>
              <dd>{{ categoryLabel(ticket.category) }}</dd>
            </div>
            <div>
              <dt>Client</dt>
              <dd>{{ ticket.client.fullName }}</dd>
            </div>
            <div>
              <dt>Agent</dt>
              <dd>{{ ticket.agent?.fullName || 'Non assigne' }}</dd>
            </div>
            <div>
              <dt>SLA</dt>
              <dd>{{ ticket.slaDeadline | date:'dd/MM/yyyy HH:mm' }}</dd>
            </div>
          </dl>

          <div class="comments" *ngIf="ticket.comments.length">
            <h4>Echanges</h4>
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

            <div class="staff-actions" *ngIf="isStaff()">
              <div class="action-group">
                <label>Statut</label>
                <div>
                  <select #statusSel aria-label="Changer le statut">
                    <option *ngFor="let s of statuses" [value]="s" [selected]="s === ticket.status">{{ statusLabel(s) }}</option>
                  </select>
                  <button type="button" (click)="changeStatus(ticket.id, statusSel.value)">Mettre a jour</button>
                </div>
              </div>

              <div class="action-group">
                <label>Priorite</label>
                <div>
                  <select #prioritySel aria-label="Changer la priorite">
                    <option *ngFor="let p of priorities" [value]="p" [selected]="p === ticket.priority">{{ priorityLabel(p) }}</option>
                  </select>
                  <button type="button" (click)="changePriority(ticket.id, prioritySel.value)">Changer</button>
                </div>
              </div>

              <div class="action-group">
                <label>Assignation</label>
                <div>
                  <select #agentSel aria-label="Assigner le ticket" [disabled]="agents().length === 0">
                    <option value="">Choisir agent</option>
                    <option *ngFor="let agent of agents()" [value]="agent.id" [selected]="ticket.agent?.id === agent.id">{{ agent.fullName }}</option>
                  </select>
                  <button type="button" (click)="assign(ticket.id, agentSel.value)" [disabled]="!agentSel.value">Assigner</button>
                </div>
              </div>
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
        max-width: 1180px;
        margin: 0 auto;
        display: grid;
        gap: 1.6rem;
      }

      .page-header,
      .list-header,
      .filter-top {
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
        max-width: 480px;
        color: var(--text-secondary);
        line-height: 1.65;
      }

      .new-ticket,
      .ticket-card,
      .empty-state,
      .filter-card {
        background: #fff;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
      }

      .new-ticket,
      .filter-card {
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
      .list-header h2,
      .filter-top h2 {
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

      .field label,
      .action-group label {
        color: var(--text-primary);
        font-size: 0.86rem;
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

      .form-grid,
      .filters-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
      }

      .search-field {
        grid-column: span 2;
      }

      .form-footer,
      .filter-actions,
      .manager-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.6rem;
        flex-wrap: wrap;
      }

      .btn-submit,
      .btn-light,
      .btn-reset,
      .comment-form button,
      .staff-actions button,
      .rating button,
      .quick-stats button {
        border-radius: var(--radius-md);
        font-weight: 900;
        cursor: pointer;
      }

      .btn-submit {
        min-height: 42px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.65rem;
        border: 0;
        background: var(--brand-blue);
        color: #fff;
        padding: 0.75rem 1.05rem;
      }

      .btn-light,
      .btn-reset {
        min-height: 40px;
        border: 1px solid var(--line);
        background: var(--surface-soft);
        color: var(--brand-blue);
        padding: 0.6rem 0.85rem;
      }

      .btn-light.danger {
        color: var(--danger);
        background: var(--danger-soft);
      }

      .btn-submit:disabled,
      .comment-form button:disabled,
      .staff-actions button:disabled {
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

      .quick-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 0.75rem;
      }

      .quick-stats button {
        min-height: 76px;
        border: 1px solid var(--line);
        background: var(--surface-soft);
        color: var(--text-primary);
        text-align: left;
        padding: 0.8rem;
      }

      .quick-stats span {
        display: block;
        color: var(--text-muted);
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .quick-stats strong {
        display: block;
        margin-top: 0.2rem;
        font-family: 'Sora', sans-serif;
        font-size: 1.35rem;
      }

      .filter-flags {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .filter-flags label {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        color: var(--text-secondary);
        font-weight: 800;
      }

      .filter-flags input {
        width: auto;
      }

      .filter-actions {
        margin-left: auto;
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

      .badges-line {
        display: flex;
        gap: 0.45rem;
        flex-wrap: wrap;
        margin-bottom: 0.55rem;
      }

      .id,
      .archive-badge,
      .sla-badge {
        display: inline-flex;
        border-radius: var(--radius-sm);
        padding: 0.22rem 0.5rem;
        font-size: 0.76rem;
        font-weight: 900;
      }

      .id {
        color: var(--brand-blue);
        background: var(--brand-blue-soft);
      }

      .archive-badge {
        color: var(--text-secondary);
        background: var(--surface-soft);
      }

      .sla-badge[data-sla="late"] {
        background: var(--danger-soft);
        color: var(--danger);
      }

      .sla-badge[data-sla="soon"] {
        background: var(--warning-soft);
        color: var(--warning);
      }

      .sla-badge[data-sla="ok"],
      .sla-badge[data-sla="done"] {
        background: var(--success-soft);
        color: var(--success);
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

      .attachment-link {
        width: fit-content;
        color: var(--brand-blue);
        font-weight: 900;
        text-decoration: none;
      }

      .ticket-meta {
        display: grid;
        grid-template-columns: repeat(6, minmax(120px, 1fr));
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
        border: 0;
        padding: 0.65rem 0.9rem;
        background: var(--brand-blue);
        color: #fff;
      }

      .staff-actions {
        display: grid;
        grid-template-columns: repeat(3, minmax(210px, 1fr));
        gap: 0.8rem;
      }

      .action-group {
        display: grid;
        gap: 0.4rem;
      }

      .action-group div {
        display: flex;
        gap: 0.5rem;
      }

      .action-group select {
        min-width: 0;
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

      @media (max-width: 980px) {
        .page-header,
        .list-header,
        .filter-top {
          display: grid;
          align-items: start;
        }

        .form-grid,
        .filters-grid,
        .ticket-meta,
        .staff-actions {
          grid-template-columns: 1fr 1fr;
        }

        .search-field {
          grid-column: span 2;
        }
      }

      @media (max-width: 620px) {
        h1 {
          font-size: 1.75rem;
        }

        .form-grid,
        .filters-grid,
        .ticket-meta,
        .staff-actions {
          grid-template-columns: 1fr;
        }

        .search-field {
          grid-column: auto;
        }

        .ticket-top,
        .comment-form,
        .action-group div {
          display: grid;
        }

        .filter-actions {
          width: 100%;
          margin-left: 0;
        }
      }
    `
  ]
})
export class TicketsPage implements OnInit {
  readonly tickets = signal<Ticket[]>([]);
  readonly agents = signal<UserSummary[]>([]);
  readonly saving = signal(false);
  readonly notice = signal('');
  readonly error = signal('');

  readonly search = signal('');
  readonly statusFilter = signal<TicketStatus | 'ALL'>('ALL');
  readonly priorityFilter = signal<TicketPriority | 'ALL'>('ALL');
  readonly categoryFilter = signal<TicketCategory | 'ALL'>('ALL');
  readonly typeFilter = signal<TicketType | 'ALL'>('ALL');
  readonly agentFilter = signal<string>('ALL');
  readonly assignedToMe = signal(false);
  readonly mineOnly = signal(false);
  readonly overdueOnly = signal(false);
  readonly includeArchived = signal(false);

  readonly totalTickets = computed(() => this.tickets().length);
  readonly openCount = computed(() => this.tickets().filter((ticket) => ticket.status === 'OUVERT').length);
  readonly overdueCount = computed(() => this.tickets().filter((ticket) => this.isSlaLate(ticket)).length);
  readonly criticalCount = computed(() => this.tickets().filter((ticket) => ticket.priority === 'CRITIQUE').length);
  readonly unassignedCount = computed(() => this.tickets().filter((ticket) => !ticket.agent).length);

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
    if (this.isStaff()) {
      this.loadSupportUsers();
    }
    this.load();
  }

  load(): void {
    this.error.set('');
    this.api.tickets(this.buildFilters()).subscribe({
      next: (res: Ticket[]) => this.tickets.set(res),
      error: () => this.error.set('Impossible de charger les tickets.')
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
        this.notice.set('Ticket envoye. Il apparait maintenant dans votre suivi.');
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
        this.error.set("Le ticket n'a pas pu etre envoye.");
      }
    });
  }

  changeStatus(id: number, value: string): void {
    this.api.changeTicketStatus(id, value as TicketStatus).subscribe({
      next: () => {
        this.notice.set('Statut mis a jour.');
        this.load();
      },
      error: () => this.error.set('Impossible de mettre le statut a jour.')
    });
  }

  changePriority(id: number, value: string): void {
    this.api.changeTicketPriority(id, value as TicketPriority).subscribe({
      next: () => {
        this.notice.set('Priorite mise a jour.');
        this.load();
      },
      error: () => this.error.set('Impossible de mettre la priorite a jour.')
    });
  }

  assign(id: number, value: string): void {
    const agentId = Number(value);
    if (!agentId) {
      return;
    }

    this.api.assignTicket(id, agentId).subscribe({
      next: () => {
        this.notice.set('Ticket assigne.');
        this.load();
      },
      error: () => this.error.set("Impossible d'assigner ce ticket.")
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
      error: () => this.error.set("Le commentaire n'a pas pu etre ajoute.")
    });
  }

  rate(id: number, score: number): void {
    this.api.rateTicket(id, score).subscribe({
      next: () => {
        this.notice.set('Merci, votre note est enregistree.');
        this.load();
      },
      error: () => this.error.set("La note n'a pas pu etre enregistree.")
    });
  }

  archiveClosed(): void {
    this.api.archiveClosedTickets().subscribe({
      next: (count) => {
        this.notice.set(`${count} ticket${count > 1 ? 's' : ''} ferme${count > 1 ? 's' : ''} archive${count > 1 ? 's' : ''}.`);
        this.load();
      },
      error: () => this.error.set("Impossible d'archiver les tickets fermes.")
    });
  }

  escalateSla(): void {
    this.api.escalateSla().subscribe({
      next: (count) => {
        this.notice.set(`${count} ticket${count > 1 ? 's' : ''} en retard traite${count > 1 ? 's' : ''}.`);
        this.load();
      },
      error: () => this.error.set("Impossible d'escalader les tickets en retard.")
    });
  }

  resetFilters(): void {
    this.search.set('');
    this.statusFilter.set('ALL');
    this.priorityFilter.set('ALL');
    this.categoryFilter.set('ALL');
    this.typeFilter.set('ALL');
    this.agentFilter.set('ALL');
    this.assignedToMe.set(false);
    this.mineOnly.set(false);
    this.overdueOnly.set(false);
    this.includeArchived.set(false);
    this.load();
  }

  setStatus(status: TicketStatus): void {
    this.statusFilter.set(status);
    this.load();
  }

  setPriority(priority: TicketPriority): void {
    this.priorityFilter.set(priority);
    this.load();
  }

  showOverdueOnly(): void {
    this.overdueOnly.set(true);
    this.load();
  }

  showUnassigned(): void {
    this.agentFilter.set('UNASSIGNED');
    this.load();
  }

  statusLabel(status: TicketStatus): string {
    const labels: Record<TicketStatus, string> = {
      OUVERT: 'Ouvert',
      EN_COURS: 'En cours',
      EN_ATTENTE: 'En attente',
      RESOLU: 'Resolu',
      FERME: 'Ferme'
    };
    return labels[status];
  }

  priorityLabel(priority: TicketPriority): string {
    const labels: Record<TicketPriority, string> = {
      FAIBLE: 'Faible',
      MOYENNE: 'Moyenne',
      ELEVEE: 'Elevee',
      CRITIQUE: 'Critique'
    };
    return labels[priority];
  }

  categoryLabel(category: TicketCategory): string {
    const labels: Record<TicketCategory, string> = {
      MATERIEL: 'Materiel',
      LOGICIEL: 'Logiciel',
      RESEAU: 'Reseau',
      ACCES: 'Acces',
      AUTRE: 'Autre'
    };
    return labels[category];
  }

  typeLabel(type: TicketType): string {
    return type === 'INCIDENT' ? 'Incident' : 'Demande';
  }

  slaState(ticket: Ticket): 'late' | 'soon' | 'ok' | 'done' {
    if (ticket.status === 'RESOLU' || ticket.status === 'FERME') {
      return 'done';
    }
    const remainingMs = new Date(ticket.slaDeadline).getTime() - Date.now();
    if (remainingMs < 0) {
      return 'late';
    }
    return remainingMs <= 4 * 60 * 60 * 1000 ? 'soon' : 'ok';
  }

  slaLabel(ticket: Ticket): string {
    const state = this.slaState(ticket);
    if (state === 'late') {
      return 'SLA depasse';
    }
    if (state === 'soon') {
      return 'SLA proche';
    }
    if (state === 'done') {
      return 'SLA cloture';
    }
    return 'SLA actif';
  }

  isStaff(): boolean {
    return this.auth.hasAnyRole(['ADMIN', 'AGENT', 'SUPERVISEUR']);
  }

  isManager(): boolean {
    return this.auth.hasAnyRole(['ADMIN', 'SUPERVISEUR']);
  }

  private buildFilters(): TicketFilters {
    const filters: TicketFilters = {};
    const q = this.search().trim();
    if (q) {
      filters.q = q;
    }
    if (this.statusFilter() !== 'ALL') {
      filters.status = this.statusFilter() as TicketStatus;
    }
    if (this.priorityFilter() !== 'ALL') {
      filters.priority = this.priorityFilter() as TicketPriority;
    }
    if (this.categoryFilter() !== 'ALL') {
      filters.category = this.categoryFilter() as TicketCategory;
    }
    if (this.typeFilter() !== 'ALL') {
      filters.type = this.typeFilter() as TicketType;
    }
    if (this.agentFilter() !== 'ALL' && this.agentFilter() !== 'UNASSIGNED') {
      filters.agentId = Number(this.agentFilter());
    }
    if (this.agentFilter() === 'UNASSIGNED') {
      filters.unassigned = true;
    }
    if (this.assignedToMe()) {
      filters.assignedToMe = true;
    }
    if (this.mineOnly()) {
      filters.mine = true;
    }
    if (this.overdueOnly()) {
      filters.overdue = true;
    }
    if (this.includeArchived()) {
      filters.includeArchived = true;
    }
    return filters;
  }

  private loadSupportUsers(): void {
    this.api.supportUsers().subscribe({
      next: (res) => this.agents.set(res),
      error: () => this.agents.set([])
    });
  }

  private isSlaLate(ticket: Ticket): boolean {
    return this.slaState(ticket) === 'late';
  }
}
