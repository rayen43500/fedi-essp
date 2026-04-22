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
        <h1>Assistant IA Topnet</h1>
        <p class="subtitle">Obtenez des réponses instantanées grâce à notre intelligence artificielle.</p>
      </div>

      <div class="chat-container">
        <div class="chat-input-area">
          <div class="input-wrapper">
            <textarea [(ngModel)]="question" rows="3" placeholder="Posez votre question ici (ex: Comment configurer mon accès VPN ?)..."></textarea>
            <button (click)="ask()" [disabled]="!question.trim() || loading()" class="btn-send">
              <span *ngIf="!loading()">Envoyer la question</span>
              <span *ngIf="loading()">Analyse en cours...</span>
              <svg *ngIf="!loading()" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>

        <div class="chat-response" *ngIf="reply() as r">
          <div class="bot-answer">
            <div class="bot-avatar">🤖</div>
            <div class="answer-bubble">
              <h3>Réponse de l'assistant</h3>
              <p>{{ r.answer }}</p>
            </div>
          </div>

          <div class="suggestions" *ngIf="r.suggestions.length">
            <div class="suggestions-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <h4>Articles de la FAQ suggérés</h4>
            </div>
            <div class="suggestions-list">
              <article *ngFor="let s of r.suggestions" class="suggestion-card">
                <strong>{{ s.title }}</strong>
                <p>{{ s.content | slice:0:120 }}...</p>
                <button class="btn-link">Lire l'article complet</button>
              </article>
            </div>
          </div>
        </div>

        <div class="empty-chat" *ngIf="!reply() && !loading()">
          <div class="illustration">💬</div>
          <p>N'hésitez pas à poser une question technique. Notre IA analyse la base de connaissances pour vous répondre instantanément.</p>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .chatbot-page { max-width: 900px; margin: 0 auto; display: grid; gap: 2rem; }
      .page-header h1 { font-size: 2.2rem; color: #0f172a; margin-bottom: 0.5rem; }
      .page-header .subtitle { color: #64748b; font-size: 1.1rem; }

      .chat-container { display: grid; gap: 2rem; }

      .chat-input-area {
        background: #fff;
        padding: 2rem;
        border-radius: 24px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
        border: 1px solid #f1f5f9;
      }
      .input-wrapper { display: flex; flex-direction: column; gap: 1rem; }
      textarea {
        width: 100%;
        border: 1.5px solid #e2e8f0;
        border-radius: 16px;
        padding: 1rem;
        font-family: inherit;
        font-size: 1.1rem;
        transition: border-color 0.2s;
        resize: none;
      }
      textarea:focus { outline: none; border-color: var(--brand-blue); }
      
      .btn-send {
        align-self: flex-end;
        background: var(--brand-blue);
        color: #fff;
        border: none;
        padding: 0.85rem 1.5rem;
        border-radius: 12px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
      }
      .btn-send:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 89, 163, 0.3); }
      .btn-send:disabled { opacity: 0.7; cursor: not-allowed; }

      .chat-response { display: grid; gap: 2rem; animation: slideUp 0.4s ease-out; }
      @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

      .bot-answer { display: flex; gap: 1rem; }
      .bot-avatar { width: 44px; height: 44px; background: var(--brand-blue); color: #fff; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
      .answer-bubble { background: #fff; padding: 1.5rem; border-radius: 0 20px 20px 20px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); border: 1px solid #f1f5f9; flex: 1; }
      .answer-bubble h3 { font-size: 1rem; color: var(--brand-blue); margin-bottom: 0.75rem; }
      .answer-bubble p { color: #1e293b; line-height: 1.6; font-size: 1.1rem; }

      .suggestions { margin-top: 1rem; }
      .suggestions-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; color: #475569; }
      .suggestions-header h4 { font-size: 1.1rem; margin: 0; }
      .suggestions-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
      .suggestion-card { background: var(--brand-blue-light); padding: 1.5rem; border-radius: 20px; border: 1px solid rgba(0, 89, 163, 0.1); }
      .suggestion-card strong { display: block; font-size: 1.1rem; color: #0f172a; margin-bottom: 0.75rem; }
      .suggestion-card p { font-size: 0.9rem; color: #475569; margin-bottom: 1.25rem; line-height: 1.5; }
      .btn-link { background: none; border: none; color: var(--brand-blue); font-weight: 700; cursor: pointer; padding: 0; font-size: 0.9rem; }

      .empty-chat { text-align: center; padding: 3rem; color: #94a3b8; }
      .empty-chat .illustration { font-size: 4rem; margin-bottom: 1.5rem; opacity: 0.5; }
      .empty-chat p { font-size: 1.1rem; max-width: 500px; margin: 0 auto; line-height: 1.5; }
    `
  ]
})
export class ChatbotPage {
  question = '';
  readonly reply = signal<ChatbotReply | null>(null);
  readonly loading = signal(false);

  constructor(private readonly api: ApiService) {}

  ask() {
    this.loading.set(true);
    this.api.chatbot(this.question).subscribe({
      next: (res) => {
        this.reply.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
