import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Ticket, TicketStatus } from '../../core/models';

@Component({
  selector: 'app-tickets-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="tickets-page">
      <h2>Gestion des tickets</h2>

      <form class="new-ticket" [formGroup]="form" (ngSubmit)="create()">
        <input formControlName="title" placeholder="Titre du ticket" />
        <textarea formControlName="description" rows="3" placeholder="Description detaillee"></textarea>
        <div class="row">
          <select formControlName="type">
            <option value="INCIDENT">Incident</option>
            <option value="DEMANDE">Demande</option>
          </select>
          <select formControlName="category">
            <option value="MATERIEL">Materiel</option>
            <option value="LOGICIEL">Logiciel</option>
            <option value="RESEAU">Reseau</option>
            <option value="ACCES">Acces</option>
            <option value="AUTRE">Autre</option>
          </select>
          <select formControlName="priority">
            <option value="FAIBLE">Faible</option>
            <option value="MOYENNE">Moyenne</option>
            <option value="ELEVEE">Elevee</option>
            <option value="CRITIQUE">Critique</option>
          </select>
        </div>
        <button type="submit" [disabled]="form.invalid">Creer ticket</button>
      </form>

      <div class="list">
        <article *ngFor="let ticket of tickets()">
          <header>
            <h3>#{{ ticket.id }} - {{ ticket.title }}</h3>
            <span class="status">{{ ticket.status }}</span>
          </header>
          <p>{{ ticket.description }}</p>
          <div class="meta">
            <span>Priorite: {{ ticket.priority }}</span>
            <span>Categorie: {{ ticket.category }}</span>
            <span>Client: {{ ticket.client.fullName }}</span>
            <span>Agent: {{ ticket.agent?.fullName || 'Non assigne' }}</span>
          </div>
          <div class="actions">
            <select #statusSel>
              <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
            </select>
            <button (click)="changeStatus(ticket.id, statusSel.value)">Changer statut</button>
            <button (click)="rate(ticket.id, 5)">Noter 5/5</button>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [
    `
      .tickets-page { display: grid; gap: 1rem; }
      .new-ticket {
        display: grid;
        gap: 0.7rem;
        background: #fff;
        border-radius: 14px;
        padding: 1rem;
        box-shadow: 0 8px 18px rgba(8, 24, 40, 0.08);
      }
      input, textarea, select {
        border: 1px solid #c8d3de;
        border-radius: 10px;
        padding: 0.7rem;
      }
      .row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.7rem;
      }
      .list {
        display: grid;
        gap: 0.8rem;
      }
      article {
        background: #fff;
        border-radius: 14px;
        padding: 1rem;
        box-shadow: 0 8px 18px rgba(8, 24, 40, 0.08);
      }
      header {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .status {
        background: #d5f4ef;
        color: #0f766e;
        border-radius: 999px;
        padding: 0.2rem 0.65rem;
        font-size: 0.82rem;
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.8rem;
        color: #4f5f6f;
        font-size: 0.9rem;
      }
      .actions {
        margin-top: 0.8rem;
        display: flex;
        gap: 0.6rem;
      }
      button {
        border: 0;
        background: #0b4a6b;
        color: #fff;
        border-radius: 8px;
        padding: 0.55rem 0.8rem;
        cursor: pointer;
      }
      @media (max-width: 820px) {
        .row { grid-template-columns: 1fr; }
      }
    `
  ]
})
export class TicketsPage implements OnInit {
  readonly tickets = signal<Ticket[]>([]);
  readonly statuses: TicketStatus[] = ['OUVERT', 'EN_COURS', 'EN_ATTENTE', 'RESOLU', 'FERME'];

  readonly form;

  constructor(private readonly api: ApiService, private readonly fb: FormBuilder) {
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
    this.api.tickets().subscribe((res) => this.tickets.set(res));
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
