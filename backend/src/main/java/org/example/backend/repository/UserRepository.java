package org.example.backend.repository;

import org.example.backend.domain.Role;
import org.example.backend.domain.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserAccount, Long> {
    Optional<UserAccount> findByEmail(String email);

    List<UserAccount> findByRolesContainingAndActiveTrue(Role role);
}
