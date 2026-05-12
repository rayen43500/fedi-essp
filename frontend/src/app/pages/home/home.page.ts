import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="home">
      <nav class="top-nav" aria-label="Navigation publique">
        <a class="logo-container" routerLink="/">
          <img src="/image.png" alt="Topnet" class="main-logo" />
          <span>Support Topnet</span>
        </a>
        <div class="nav-links">
          <a class="btn-text" routerLink="/login">Connexion</a>
          <a class="btn primary small" routerLink="/register">Créer un compte</a>
        </div>
      </nav>

      <section class="hero">
        <div class="hero-content">
          <p class="eyebrow">Portail support et suivi SLA</p>
          <h1>Support Topnet, clair pour les clients et efficace pour les équipes.</h1>
          <p class="lead">
            Centralisez les tickets, suivez les priorités et donnez des réponses plus utiles sans perdre le contact humain.
          </p>

          <div class="cta-group">
            <a class="btn primary large" [routerLink]="primaryLink()">
              {{ primaryText() }}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </a>
            <a class="btn secondary large" [routerLink]="knowledgeLink()">Consulter les guides</a>
          </div>

          <dl class="stats" aria-label="Indicateurs clés">
            <div>
              <dt>24/7</dt>
              <dd>Demandes centralisées</dd>
            </div>
            <div>
              <dt>SLA</dt>
              <dd>Priorités visibles</dd>
            </div>
            <div>
              <dt>4 rôles</dt>
              <dd>Client, agent, superviseur, admin</dd>
            </div>
          </dl>
        </div>

        <div class="hero-visual" aria-label="Aperçu de la plateforme">
          <div class="browser-bar">
            <span></span>
            <span></span>
            <span></span>
            <strong>support.topnet.local</strong>
          </div>
          <div class="support-preview">
            <aside>
              <img src="/image.png" alt="" />
              <span class="nav-line active"></span>
              <span class="nav-line"></span>
              <span class="nav-line short"></span>
            </aside>
            <section>
              <div class="preview-header">
                <div>
                  <span>Ticket #1284</span>
                  <strong>Connexion réseau instable</strong>
                </div>
                <em>En cours</em>
              </div>
              <div class="timeline">
                <article>
                  <span></span>
                  <div>
                    <strong>Client</strong>
                    <p>Incident créé avec priorité élevée.</p>
                  </div>
                </article>
                <article>
                  <span></span>
                  <div>
                    <strong>Agent support</strong>
                    <p>Diagnostic lancé, guide associé automatiquement.</p>
                  </div>
                </article>
              </div>
              <div class="preview-grid">
                <div><strong>8h</strong><span>SLA restant</span></div>
                <div><strong>5/5</strong><span>Satisfaction</span></div>
              </div>
            </section>
          </div>
        </div>
      </section>

      <section class="features" aria-label="Fonctions principales">
        <article>
          <span class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v2a3 3 0 0 0 0 6v2a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-2a3 3 0 0 0 0-6V7Z"/></svg>
          </span>
          <h2>Tickets structurés</h2>
          <p>Les demandes arrivent avec catégorie, priorité, agent et statut lisibles dès le premier coup d’œil.</p>
        </article>
        <article>
          <span class="feature-icon orange">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </span>
          <h2>Guides intégrés</h2>
          <p>La base de connaissances accompagne les clients et réduit les réponses répétitives pour les agents.</p>
        </article>
        <article>
          <span class="feature-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-4 4"/></svg>
          </span>
          <h2>Pilotage opérationnel</h2>
          <p>Les superviseurs gardent une vue nette sur les volumes, les délais et la satisfaction.</p>
        </article>
      </section>
    </main>
  `,
  styles: [
    `
      .home {
        min-height: 100vh;
        background: linear-gradient(180deg, #ffffff 0%, #f4f8fb 100%);
      }

      .top-nav {
        max-width: var(--container);
        margin: 0 auto;
        min-height: 78px;
        padding: 0 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .logo-container {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: var(--brand-blue-dark);
        text-decoration: none;
        font-family: 'Sora', sans-serif;
        font-weight: 900;
      }

      .main-logo {
        height: 38px;
        width: auto;
      }

      .nav-links,
      .cta-group {
        display: flex;
        align-items: center;
        gap: 0.85rem;
      }

      .btn-text {
        text-decoration: none;
        color: var(--text-secondary);
        font-weight: 800;
      }

      .btn-text:hover {
        color: var(--brand-blue);
      }

      .hero {
        max-width: var(--container);
        margin: 0 auto;
        padding: 4.8rem 1.5rem 4rem;
        display: grid;
        grid-template-columns: minmax(0, 1.02fr) minmax(360px, 0.98fr);
        gap: 4.5rem;
        align-items: center;
      }

      .hero-content {
        max-width: 670px;
      }

      .eyebrow {
        display: inline-flex;
        padding: 0.42rem 0.7rem;
        border-radius: var(--radius-sm);
        background: var(--brand-orange-soft);
        color: var(--brand-orange-dark);
        font-size: 0.78rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin-bottom: 1.2rem;
      }

      h1 {
        color: var(--text-primary);
        font-size: 4rem;
        line-height: 1.03;
        max-width: 780px;
      }

      .lead {
        color: var(--text-secondary);
        font-size: 1.18rem;
        line-height: 1.65;
        max-width: 620px;
        margin: 1.4rem 0 2rem;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.55rem;
        min-height: 42px;
        border-radius: var(--radius-md);
        font-weight: 900;
        text-decoration: none;
        transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
      }

      .btn.primary {
        background: var(--brand-blue);
        color: #fff;
        box-shadow: 0 12px 28px rgba(0, 89, 163, 0.22);
      }

      .btn.primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 16px 34px rgba(0, 89, 163, 0.28);
      }

      .btn.secondary {
        background: #fff;
        color: var(--brand-blue);
        border: 1px solid var(--line);
      }

      .btn.secondary:hover {
        background: var(--brand-blue-soft);
      }

      .btn.small {
        padding: 0.55rem 1rem;
        font-size: 0.92rem;
      }

      .btn.large {
        padding: 0.9rem 1.25rem;
        font-size: 1rem;
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
        margin-top: 2.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--line);
      }

      .stats div {
        display: grid;
        gap: 0.2rem;
      }

      .stats dt {
        font-family: 'Sora', sans-serif;
        font-size: 1.35rem;
        font-weight: 900;
        color: var(--brand-blue-dark);
      }

      .stats dd {
        color: var(--text-muted);
        font-size: 0.9rem;
      }

      .hero-visual {
        border-radius: var(--radius-lg);
        background: #fff;
        border: 1px solid var(--line);
        box-shadow: var(--shadow-md);
        overflow: hidden;
      }

      .browser-bar {
        height: 48px;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0 1rem;
        border-bottom: 1px solid var(--line);
        background: #f8fafc;
      }

      .browser-bar span {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #cbd5e1;
      }

      .browser-bar span:first-child {
        background: #f97316;
      }

      .browser-bar strong {
        margin-left: 0.5rem;
        color: var(--text-muted);
        font-size: 0.8rem;
        font-weight: 800;
      }

      .support-preview {
        display: grid;
        grid-template-columns: 112px 1fr;
        min-height: 420px;
      }

      .support-preview aside {
        padding: 1.25rem;
        background: #082b49;
        display: grid;
        align-content: start;
        gap: 1rem;
      }

      .support-preview aside img {
        width: 56px;
        margin-bottom: 1rem;
      }

      .nav-line {
        height: 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.28);
      }

      .nav-line.active {
        background: #fff;
      }

      .nav-line.short {
        width: 64%;
      }

      .support-preview section {
        padding: 1.5rem;
        display: grid;
        gap: 1.25rem;
        align-content: start;
      }

      .preview-header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--line);
      }

      .preview-header span {
        display: block;
        color: var(--brand-blue);
        font-size: 0.78rem;
        font-weight: 900;
        margin-bottom: 0.35rem;
      }

      .preview-header strong {
        font-family: 'Sora', sans-serif;
        font-size: 1.18rem;
      }

      .preview-header em {
        height: fit-content;
        padding: 0.32rem 0.62rem;
        border-radius: 999px;
        background: var(--brand-blue-soft);
        color: var(--brand-blue);
        font-style: normal;
        font-size: 0.78rem;
        font-weight: 900;
      }

      .timeline {
        display: grid;
        gap: 1rem;
      }

      .timeline article {
        display: grid;
        grid-template-columns: 12px 1fr;
        gap: 0.9rem;
      }

      .timeline article > span {
        width: 12px;
        height: 12px;
        margin-top: 0.35rem;
        border-radius: 50%;
        background: var(--brand-orange);
      }

      .timeline strong {
        display: block;
        margin-bottom: 0.2rem;
      }

      .timeline p {
        color: var(--text-secondary);
        font-size: 0.94rem;
        line-height: 1.45;
      }

      .preview-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .preview-grid div {
        padding: 1rem;
        background: var(--surface-soft);
        border-radius: var(--radius-md);
        border: 1px solid var(--line);
      }

      .preview-grid strong {
        display: block;
        font-family: 'Sora', sans-serif;
        color: var(--brand-blue-dark);
        font-size: 1.3rem;
      }

      .preview-grid span {
        color: var(--text-muted);
        font-size: 0.85rem;
      }

      .features {
        max-width: var(--container);
        margin: 0 auto;
        padding: 0 1.5rem 5rem;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
      }

      .features article {
        background: #fff;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        padding: 1.4rem;
        box-shadow: var(--shadow-sm);
      }

      .feature-icon {
        width: 42px;
        height: 42px;
        display: grid;
        place-items: center;
        border-radius: var(--radius-md);
        background: var(--brand-blue-soft);
        color: var(--brand-blue);
        margin-bottom: 1.1rem;
      }

      .feature-icon.orange {
        background: var(--brand-orange-soft);
        color: var(--brand-orange-dark);
      }

      .feature-icon.green {
        background: var(--success-soft);
        color: var(--success);
      }

      .features h2 {
        font-size: 1.12rem;
        margin-bottom: 0.55rem;
      }

      .features p {
        color: var(--text-secondary);
        line-height: 1.55;
      }

      @media (max-width: 980px) {
        .hero {
          grid-template-columns: 1fr;
          gap: 2.5rem;
          padding-top: 3rem;
        }

        h1 {
          font-size: 3rem;
        }

        .features {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 640px) {
        .top-nav {
          min-height: auto;
          padding-top: 1rem;
          align-items: flex-start;
          gap: 1rem;
        }

        .nav-links {
          gap: 0.5rem;
        }

        .logo-container span {
          display: none;
        }

        .hero {
          padding-top: 2.2rem;
        }

        h1 {
          font-size: 2.35rem;
        }

        .lead {
          font-size: 1rem;
        }

        .cta-group,
        .stats {
          grid-template-columns: 1fr;
          align-items: stretch;
        }

        .cta-group {
          display: grid;
        }

        .support-preview {
          grid-template-columns: 1fr;
        }

        .support-preview aside {
          display: none;
        }
      }
    `
  ]
})
export class HomePage {
  readonly primaryLink = computed(() => (this.auth.isAuthenticated() ? '/app/dashboard' : '/login'));
  readonly knowledgeLink = computed(() => (this.auth.isAuthenticated() ? '/app/knowledge' : '/login'));
  readonly primaryText = computed(() => (this.auth.isAuthenticated() ? 'Accéder à mon espace' : 'Démarrer maintenant'));

  constructor(private readonly auth: AuthService) {}
}
