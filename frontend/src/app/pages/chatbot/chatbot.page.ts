import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ChatbotReply } from '../../core/models';

@Component({
  selector: 'app-chatbot-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="chatbot-page">
      <div class="page-header">
        <div>
          <p class="eyebrow">Aide guidée</p>
          <h1>Assistant support Topnet</h1>
        </div>
        <p class="subtitle">
          Posez une question technique. L’assistant propose une réponse courte et les articles proches de votre demande.
        </p>
      </div>

      <div class="chat-container">
        <form class="chat-input-area" (ngSubmit)="ask()">
          <label for="support-question">Votre question</label>
          <div class="input-wrapper">
            <textarea id="support-question" [(ngModel)]="question" name="question" rows="4" placeholder="Ex. Comment configurer mon accès VPN ?"></textarea>
            <button type="submit" [disabled]="!question.trim() || loading()" class="btn-send">
              <span>{{ loading() ? 'Analyse en cours...' : 'Envoyer' }}</span>
              <svg *ngIf="!loading()" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7Z"/></svg>
            </button>
          </div>
        </form>

        <p class="error" *ngIf="error()">{{ error() }}</p>

        <div class="chat-response" *ngIf="reply() as r">
          <div class="bot-answer">
            <div class="bot-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/></svg>
            </div>
            <div class="answer-bubble">
              <span>Réponse proposée</span>
              <p>{{ r.answer }}</p>
            </div>
          </div>

          <div class="suggestions" *ngIf="r.suggestions.length">
            <div class="suggestions-header">
              <div>
                <p class="eyebrow">Articles liés</p>
                <h2>À consulter ensuite</h2>
              </div>
            </div>
            <div class="suggestions-list">
              <article *ngFor="let s of r.suggestions" class="suggestion-card">
                <strong>{{ s.title }}</strong>
                <p [class.clamped]="expandedSuggestionId() !== s.id">{{ s.content }}</p>
                <button type="button" class="btn-link" (click)="toggleSuggestion(s.id)">
                  {{ expandedSuggestionId() === s.id ? 'Réduire' : "Lire l'article" }}
                </button>
              </article>
            </div>
          </div>
        </div>

        <div class="empty-chat" *ngIf="!reply() && !loading()">
          <strong>Commencez par une question précise.</strong>
          <p>Ajoutez le contexte, le message d’erreur et ce que vous avez déjà essayé.</p>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .chatbot-page {
        max-width: 940px;
        margin: 0 auto;
        display: grid;
        gap: 1.6rem;
      }

      .page-header {
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(280px, 0.6fr);
        gap: 1.5rem;
        align-items: end;
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
        font-size: 2.2rem;
        line-height: 1.15;
      }

      .subtitle {
        color: var(--text-secondary);
        line-height: 1.65;
      }

      .chat-container {
        display: grid;
        gap: 1rem;
      }

      .chat-input-area,
      .answer-bubble,
      .suggestion-card,
      .empty-chat {
        background: #fff;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
      }

      .chat-input-area {
        padding: 1.2rem;
        display: grid;
        gap: 0.75rem;
      }

      .chat-input-area label {
        font-weight: 900;
      }

      .input-wrapper {
        display: grid;
        gap: 0.85rem;
      }

      textarea {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        padding: 0.95rem;
        background: #fff;
        color: var(--text-primary);
        resize: vertical;
        line-height: 1.55;
      }

      textarea:focus {
        outline: none;
        border-color: var(--brand-blue);
        box-shadow: 0 0 0 4px rgba(0, 89, 163, 0.10);
      }

      .btn-send {
        justify-self: end;
        min-height: 42px;
        display: inline-flex;
        align-items: center;
        gap: 0.65rem;
        background: var(--brand-blue);
        color: #fff;
        border: 0;
        padding: 0.7rem 1rem;
        border-radius: var(--radius-md);
        font-weight: 900;
        cursor: pointer;
      }

      .btn-send:disabled {
        opacity: 0.58;
        cursor: not-allowed;
      }

      .error {
        background: var(--danger-soft);
        color: var(--danger);
        border: 1px solid rgba(194, 65, 61, 0.22);
        border-radius: var(--radius-md);
        padding: 0.85rem 1rem;
        font-weight: 800;
      }

      .chat-response {
        display: grid;
        gap: 1.2rem;
      }

      .bot-answer {
        display: grid;
        grid-template-columns: 44px 1fr;
        gap: 0.85rem;
      }

      .bot-avatar {
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        background: var(--brand-blue);
        color: #fff;
        border-radius: var(--radius-md);
      }

      .answer-bubble {
        padding: 1.1rem;
      }

      .answer-bubble span {
        display: block;
        color: var(--brand-blue);
        font-size: 0.76rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin-bottom: 0.45rem;
      }

      .answer-bubble p {
        color: var(--text-primary);
        line-height: 1.7;
      }

      .suggestions-header h2 {
        font-size: 1.15rem;
      }

      .suggestions-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 1rem;
      }

      .suggestion-card {
        padding: 1rem;
        display: grid;
        gap: 0.7rem;
      }

      .suggestion-card strong {
        font-size: 1rem;
      }

      .suggestion-card p {
        color: var(--text-secondary);
        line-height: 1.58;
        white-space: pre-line;
      }

      .suggestion-card p.clamped {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .btn-link {
        justify-self: start;
        border: 1px solid var(--line);
        background: var(--surface-soft);
        color: var(--brand-blue);
        border-radius: var(--radius-md);
        padding: 0.5rem 0.7rem;
        font-weight: 900;
        cursor: pointer;
      }

      .empty-chat {
        padding: 1.3rem;
      }

      .empty-chat strong {
        display: block;
        margin-bottom: 0.3rem;
      }

      .empty-chat p {
        color: var(--text-secondary);
      }

      @media (max-width: 760px) {
        .page-header,
        .bot-answer {
          grid-template-columns: 1fr;
        }

        h1 {
          font-size: 1.8rem;
        }

        .bot-avatar {
          display: none;
        }
      }
    `
  ]
})
export class ChatbotPage {
  question = '';
  readonly reply = signal<ChatbotReply | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly expandedSuggestionId = signal<number | null>(null);

  constructor(private readonly api: ApiService) {}

  ask(): void {
    const value = this.question.trim();
    if (!value) {
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.api.chatbot(value).subscribe({
      next: (res) => {
        this.reply.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set("L'assistant n'a pas pu répondre pour le moment.");
      }
    });
  }

  toggleSuggestion(id: number): void {
    this.expandedSuggestionId.update((current) => (current === id ? null : id));
  }
}
