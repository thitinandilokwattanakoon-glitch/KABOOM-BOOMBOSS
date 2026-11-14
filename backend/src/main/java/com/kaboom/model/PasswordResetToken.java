package com.kaboom.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/** A "set a new password" link. Only the SHA-256 hash of the secret in the link is stored. */
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    @Column(name = "token_hash", length = 64)
    private String tokenHash;

    @Column(name = "account_id", nullable = false)
    private String accountId;

    /** TEACHER or STUDENT: which table accountId belongs to. */
    @Column(name = "account_type", nullable = false, length = 10)
    private String accountType;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    protected PasswordResetToken() {}

    public PasswordResetToken(String tokenHash, String accountId, String accountType, Instant expiresAt) {
        this.tokenHash = tokenHash;
        this.accountId = accountId;
        this.accountType = accountType;
        this.expiresAt = expiresAt;
    }

    public String getTokenHash() { return tokenHash; }
    public String getAccountId() { return accountId; }
    public String getAccountType() { return accountType; }
    public Instant getExpiresAt() { return expiresAt; }
}
