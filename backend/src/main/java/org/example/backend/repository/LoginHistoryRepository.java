package org.example.backend.repository;

import org.example.backend.domain.LoginHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Long> {
    List<LoginHistory> findTop20ByUserIdOrderByLoginAtDesc(Long userId);
}
