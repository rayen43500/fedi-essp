package org.example.backend.api;

import jakarta.validation.Valid;
import org.example.backend.api.dto.AuthDtos;
import org.example.backend.domain.UserAccount;
import org.example.backend.service.CurrentUserService;
import org.example.backend.service.KnowledgeService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/knowledge")
public class KnowledgeController {

    private final KnowledgeService knowledgeService;
    private final CurrentUserService currentUserService;

    public KnowledgeController(KnowledgeService knowledgeService, CurrentUserService currentUserService) {
        this.knowledgeService = knowledgeService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public List<AuthDtos.KnowledgeView> search(@RequestParam(required = false) String q) {
        return knowledgeService.search(q);
    }

    @PostMapping
    public AuthDtos.KnowledgeView create(@Valid @RequestBody AuthDtos.KnowledgeRequest request) {
        UserAccount currentUser = currentUserService.requireCurrentUser();
        return knowledgeService.create(request, currentUser);
    }

    @PutMapping("/{id}")
    public AuthDtos.KnowledgeView update(@PathVariable Long id, @Valid @RequestBody AuthDtos.KnowledgeRequest request) {
        return knowledgeService.update(id, request);
    }
}
