package com.kaboom.repository;

import com.kaboom.model.AuthToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface AuthTokenRepository extends JpaRepository<AuthToken, String> {
    /** Logs an account out everywhere (the column is named teacher_id but holds any account id). */
    @Transactional
    long deleteByTeacherId(String accountId);
}
