import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ChatbotReply, ChatMessage, KnowledgeArticle, TicketDraft } from '../../core/models';

interface UiMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Component({
  selector: 'app-chatbot-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <section class="chatbot-page">
      <div class="page-header">
        <div>
          <p class="eyebrow">Aide guidée</p>
          <h1>Assistant support Topnet</h1>
          <p class="status" [class.on]="assistantOn()">
            {{ assistantOn() ? 'IA Gemini active' : 'Mode secours (configurez GEMINI_API_KEY)' }}
          </p>
        </div>
        <p class="subtitle">
          Discutez avec l'assistant. Il consulte la base de connaissances et peut créer un ticket à votre place si nécessaire.
        </p>
      </div>

      <div class="chat-container">
        <div class="messages" *ngIf="messages().length">
          <div
            *ngFor="let msg of messages()"
            class="message"
            [class.user]="msg.role === 'user'"
            [class.assistant]="msg.role === 'assistant'"
          >
            <div class="bubble">
              <span>{{ msg.role === 'user' ? 'Vous' : 'Assistant' }}</span>
              <p>{{ msg.content }}</p>
            </div>
          </div>
        </div>

        <div class="ticket-draft" *ngIf="proposedTicket() as draft">
          <p class="eyebrow">Ticket proposé par l'IA</p>
          <h3>{{ draft.title }}</h3>
          <p class="draft-desc">{{ draft.description }}</p>
          <dl class="draft-meta">
            <div><dt>Type</dt><dd>{{ draft.type }}</dd></div>
            <div><dt>Catégorie</dt><dd>{{ draft.category }}</dd></div>
            <div><dt>Priorité</dt><dd>{{ draft.priority }}</dd></div>
          </dl>
          <div class="draft-actions" *ngIf="auth.hasAnyRole(['CLIENT'])">
            <button type="button" class="btn-confirm" (click)="confirmTicket()" [disabled]="loading()">
              Confirmer et envoyer
            </button>
            <button type="button" class="btn-cancel" (click)="cancelDraft()">Modifier</button>
          </div>
        </div>

        <div class="ticket-banner" *ngIf="lastTicketId() as ticketId">
          <strong>Ticket #{{ ticketId }} créé par l'assistant</strong>
          <p>Votre demande a été enregistrée. Suivez son avancement dans vos tickets.</p>
          <a routerLink="/app/tickets" class="btn-link">Voir mes tickets</a>
        </div>

        <div class="suggestions" *ngIf="suggestions().length">
          <p class="eyebrow">Articles liés</p>
          <div class="suggestions-list">
            <article *ngFor="let s of suggestions()" class="suggestion-card">
              <span class="suggestion-category">{{ s.category }}</span>
              <strong>{{ s.title }}</strong>
              <div
                class="content-wrap"
                [class.is-clamped]="expandedSuggestionId() !== s.id && isSuggestionLong(s.content)"
              >
                <p class="suggestion-content">{{ s.content }}</p>
                <div
                  class="fade-overlay"
                  *ngIf="isSuggestionLong(s.content) && expandedSuggestionId() !== s.id"
                  aria-hidden="true"
                ></div>
              </div>
              <button
                *ngIf="isSuggestionLong(s.content)"
                type="button"
                class="read-more"
                (click)="toggleSuggestion(s.id)"
                [attr.aria-expanded]="expandedSuggestionId() === s.id"
              >
                <span>{{ expandedSuggestionId() === s.id ? 'Réduire' : "Lire l'article" }}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  [class.rotated]="expandedSuggestionId() === s.id"
                >
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
            </article>
          </div>
        </div>

        <div class="quick-intents" *ngIf="auth.hasAnyRole(['CLIENT']) && !messages().length">
          <button type="button" class="chip" (click)="useIntent('Mon VPN ne fonctionne plus')">VPN</button>
          <button type="button" class="chip" (click)="useIntent('Problème de messagerie')">Email</button>
          <button type="button" class="chip" (click)="promptTicketCreation()">Créer un ticket</button>
        </div>

        <div class="empty-chat" *ngIf="!messages().length && !loading()">
          <strong>Commencez la conversation</strong>
          <p>L'assistant répond, propose des guides et peut ouvrir un ticket à votre place.</p>
        </div>

        <form class="chat-input-area" (ngSubmit)="send()">
          <label for="support-question">Votre message</label>
          <div class="input-wrapper">
            <textarea
              id="support-question"
              [(ngModel)]="question"
              name="question"
              rows="3"
              placeholder="Ex. Mon VPN ne se connecte plus depuis ce matin..."
              [disabled]="loading()"
            ></textarea>
            <button type="submit" [disabled]="!question.trim() || loading()" class="btn-send">
              <span>{{ loading() ? 'Réflexion...' : 'Envoyer' }}</span>
            </button>
          </div>
        </form>

        <p class="error" *ngIf="error()">{{ error() }}</p>
      </div>
    </section>
  `,
  styles: [
    `
      .chatbot-page {
        max-width: 900px;
        margin: 0 auto;
        display: grid;
        gap: 1.6rem;
      }

      .page-header {
        display: grid;
        gap: 0.75rem;
      }

      .eyebrow {
        color: var(--brand-orange-dark);
        font-size: 0.76rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin-bottom: 0.4rem;
      }

      h1 {
        font-size: 2.1rem;
        line-height: 1.15;
      }

      .status {
        margin-top: 0.35rem;
        font-size: 0.82rem;
        font-weight: 800;
        color: var(--warning);
      }

      .status.on {
        color: var(--success);
      }

      .subtitle {
        color: var(--text-secondary);
        line-height: 1.65;
      }

      .chat-container {
        display: grid;
        gap: 1rem;
      }

      .messages {
        display: grid;
        gap: 0.75rem;
        max-height: 420px;
        overflow-y: auto;
        padding-right: 0.25rem;
      }

      .message {
        display: flex;
      }

      .message.user {
        justify-content: flex-end;
      }

      .bubble {
        max-width: min(640px, 92%);
        background: #fff;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        padding: 0.85rem 1rem;
        box-shadow: var(--shadow-sm);
      }

      .message.user .bubble {
        background: var(--brand-blue-soft);
        border-color: rgba(0, 89, 163, 0.18);
      }

      .bubble span {
        display: block;
        font-size: 0.72rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted);
        margin-bottom: 0.35rem;
      }

      .bubble p {
        line-height: 1.65;
        white-space: pre-line;
      }

      .ticket-banner {
        background: var(--success-soft);
        border: 1px solid rgba(24, 135, 84, 0.22);
        border-radius: var(--radius-md);
        padding: 1rem;
        display: grid;
        gap: 0.4rem;
      }

      .ticket-banner p {
        color: var(--text-secondary);
      }

      .btn-link {
        width: fit-content;
        color: var(--brand-blue);
        font-weight: 900;
        text-decoration: none;
      }

      .chat-input-area,
      .suggestion-card,
      .empty-chat {
        background: #fff;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
      }

      .chat-input-area {
        padding: 1.1rem;
        display: grid;
        gap: 0.65rem;
      }

      .chat-input-area label {
        font-weight: 900;
      }

      .input-wrapper {
        display: grid;
        gap: 0.75rem;
      }

      textarea {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        padding: 0.9rem;
        resize: vertical;
        line-height: 1.55;
      }

      textarea:focus {
        outline: none;
        border-color: var(--brand-blue);
        box-shadow: 0 0 0 4px rgba(0, 89, 163, 0.1);
      }

      .btn-send {
        justify-self: end;
        min-height: 42px;
        border: 0;
        border-radius: var(--radius-md);
        background: var(--brand-blue);
        color: #fff;
        font-weight: 900;
        padding: 0.65rem 1rem;
        cursor: pointer;
      }

      .btn-send:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .suggestions-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 0.85rem;
      }

      .suggestion-card {
        padding: 1rem;
        display: grid;
        gap: 0.5rem;
        background: #fff;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
      }

      .suggestion-category {
        width: fit-content;
        padding: 0.2rem 0.5rem;
        background: var(--brand-blue-soft);
        color: var(--brand-blue);
        border-radius: 999px;
        font-size: 0.68rem;
        font-weight: 900;
        text-transform: uppercase;
      }

      .content-wrap {
        position: relative;
      }

      .suggestion-content {
        color: var(--text-secondary);
        line-height: 1.55;
        white-space: pre-line;
        word-break: break-word;
        overflow-wrap: break-word;
        max-width: 100%;
        margin: 0;
      }

      .content-wrap.is-clamped .suggestion-content {
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .content-wrap:not(.is-clamped) .suggestion-content {
        display: block;
        overflow: visible;
      }

      .fade-overlay {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 2.8rem;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, #fff 90%);
        pointer-events: none;
      }

      .read-more {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        border: 0;
        background: transparent;
        color: var(--brand-blue);
        padding: 0;
        font-size: 0.84rem;
        font-weight: 900;
        cursor: pointer;
      }

      .read-more svg {
        transition: transform 0.25s ease;
      }

      .read-more svg.rotated {
        transform: rotate(180deg);
      }

      .quick-intents {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .chip {
        border: 1px solid var(--line);
        background: #fff;
        color: var(--brand-blue);
        border-radius: 999px;
        padding: 0.45rem 0.8rem;
        font-weight: 800;
        font-size: 0.82rem;
        cursor: pointer;
      }

      .chip:hover {
        background: var(--brand-blue-soft);
      }

      .ticket-draft {
        background: linear-gradient(135deg, #fff 0%, var(--brand-blue-soft) 120%);
        border: 1px solid rgba(0, 89, 163, 0.22);
        border-radius: var(--radius-md);
        padding: 1.1rem;
        display: grid;
        gap: 0.65rem;
      }

      .ticket-draft h3 {
        font-size: 1.05rem;
        word-break: break-word;
      }

      .draft-desc {
        color: var(--text-secondary);
        line-height: 1.6;
        white-space: pre-line;
        word-break: break-word;
        max-height: 160px;
        overflow-y: auto;
      }

      .draft-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .draft-meta div {
        font-size: 0.82rem;
      }

      .draft-meta dt {
        color: var(--text-muted);
        font-weight: 800;
        text-transform: uppercase;
        font-size: 0.68rem;
      }

      .draft-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .btn-confirm {
        border: 0;
        background: var(--brand-blue);
        color: #fff;
        border-radius: var(--radius-md);
        padding: 0.6rem 1rem;
        font-weight: 900;
        cursor: pointer;
      }

      .btn-cancel {
        border: 1px solid var(--line);
        background: #fff;
        color: var(--text-secondary);
        border-radius: var(--radius-md);
        padding: 0.6rem 1rem;
        font-weight: 900;
        cursor: pointer;
      }

      .empty-chat {
        padding: 1.1rem;
      }

      .empty-chat p {
        color: var(--text-secondary);
        margin-top: 0.25rem;
      }

      .error {
        background: var(--danger-soft);
        color: var(--danger);
        border: 1px solid rgba(194, 65, 61, 0.22);
        border-radius: var(--radius-md);
        padding: 0.85rem 1rem;
        font-weight: 800;
      }
    `
  ]
})
export class ChatbotPage implements OnInit {
  question = '';
  readonly messages = signal<UiMessage[]>([]);
  readonly suggestions = signal<KnowledgeArticle[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly assistantOn = signal(false);
  readonly lastTicketId = signal<number | null>(null);
  readonly proposedTicket = signal<TicketDraft | null>(null);
  readonly expandedSuggestionId = signal<number | null>(null);

  constructor(
    private readonly api: ApiService,
    readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.api.assistantStatus().subscribe({
      next: (res) => this.assistantOn.set(res.enabled),
      error: () => this.assistantOn.set(false)
    });
  }

  promptTicketCreation(): void {
    this.question = 'Je souhaite créer un ticket. Mon problème : ';
  }

  useIntent(text: string): void {
    this.question = text;
  }

  confirmTicket(): void {
    const draft = this.proposedTicket();
    if (!draft || this.loading()) {
      return;
    }
    this.loading.set(true);
    this.api.chatbotChat('Confirmer la création du ticket', [], { confirmTicket: true, ticketDraft: draft }).subscribe({
      next: (res) => this.handleReply(res),
      error: () => {
        this.loading.set(false);
        this.error.set('Impossible de créer le ticket.');
      }
    });
  }

  cancelDraft(): void {
    this.proposedTicket.set(null);
    this.question = 'Je souhaite modifier le ticket : ';
  }

  send(): void {
    const value = this.question.trim();
    if (!value || this.loading()) {
      return;
    }

    const history: ChatMessage[] = this.messages().map((m) => ({
      role: m.role,
      content: m.content
    }));

    this.messages.update((list) => [...list, { role: 'user', content: value }]);
    this.question = '';
    this.loading.set(true);
    this.error.set('');

    this.api.chatbotChat(value, history).subscribe({
      next: (res) => this.handleReply(res),
      error: () => {
        this.loading.set(false);
        this.error.set("L'assistant n'a pas pu répondre pour le moment.");
      }
    });
  }

  private handleReply(res: ChatbotReply): void {
    this.messages.update((list) => [...list, { role: 'assistant', content: res.answer }]);
    this.suggestions.set(res.suggestions ?? []);
    this.assistantOn.set(res.assistantEnabled ?? false);
    this.proposedTicket.set(res.awaitingConfirmation && res.proposedTicket ? res.proposedTicket : null);
    if (res.ticketCreated && res.createdTicket) {
      this.lastTicketId.set(res.createdTicket.id);
      this.proposedTicket.set(null);
    }
    this.loading.set(false);
  }

  isSuggestionLong(content: string): boolean {
    if (!content) {
      return false;
    }
    return content.length > 280 || content.split('\n').length > 4;
  }

  toggleSuggestion(id: number): void {
    this.expandedSuggestionId.update((current) => (current === id ? null : id));
  }

  private isTicketIntent(message: string): boolean {
    const lower = message.toLowerCase();
    return lower.includes('creer un ticket')
      || lower.includes('créer un ticket')
      || lower.includes('ouvrir un ticket')
      || lower.includes('passer un ticket')
      || lower.includes('generer un ticket')
      || lower.includes('générer un ticket')
      || lower.includes('nouveau ticket');
  }
}
