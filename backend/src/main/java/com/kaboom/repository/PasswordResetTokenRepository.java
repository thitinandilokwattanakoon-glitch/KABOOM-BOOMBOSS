package com.kaboom.repository;

import com.kaboom.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, String> {
    /** Only the newest link of an account works: older ones are removed when a new one is made or a password is set. */
    @Transactional
    long deleteByAccountId(String accountId);
}
