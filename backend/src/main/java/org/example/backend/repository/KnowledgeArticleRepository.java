package org.example.backend.repository;

import org.example.backend.domain.KnowledgeArticle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KnowledgeArticleRepository extends JpaRepository<KnowledgeArticle, Long> {
    List<KnowledgeArticle> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(String title, String content);
}
