package org.example.backend.service;

import org.example.backend.api.dto.AuthDtos;
import org.example.backend.domain.KnowledgeArticle;
import org.example.backend.domain.UserAccount;
import org.example.backend.repository.KnowledgeArticleRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class KnowledgeService {

    private final KnowledgeArticleRepository repository;

    public KnowledgeService(KnowledgeArticleRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<AuthDtos.KnowledgeView> search(String q) {
        if (q == null || q.isBlank()) {
            return repository.findAll().stream().map(this::toView).toList();
        }
        return repository.findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(q, q).stream()
                .map(this::toView)
                .toList();
    }

    @Transactional
    @PreAuthorize("hasAnyRole('AGENT','SUPERVISEUR','ADMIN')")
    public AuthDtos.KnowledgeView create(AuthDtos.KnowledgeRequest request, UserAccount author) {
        KnowledgeArticle article = new KnowledgeArticle();
        article.setTitle(request.title());
        article.setContent(request.content());
        article.setCategory(request.category());
        article.setAuthor(author);
        article.setUpdatedAt(Instant.now());
        return toView(repository.save(article));
    }

    @Transactional
    @PreAuthorize("hasAnyRole('AGENT','SUPERVISEUR','ADMIN')")
    public AuthDtos.KnowledgeView update(Long id, AuthDtos.KnowledgeRequest request) {
        KnowledgeArticle article = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Article introuvable"));
        article.setTitle(request.title());
        article.setContent(request.content());
        article.setCategory(request.category());
        article.setUpdatedAt(Instant.now());
        return toView(repository.save(article));
    }

    private AuthDtos.KnowledgeView toView(KnowledgeArticle a) {
        return new AuthDtos.KnowledgeView(a.getId(), a.getTitle(), a.getContent(), a.getCategory(), a.getUpdatedAt(), a.getAuthor().getFullName());
    }
}
