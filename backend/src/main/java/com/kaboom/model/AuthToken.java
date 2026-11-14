package com.kaboom.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/** A login session. Only the SHA-256 hash of the token is stored, never the token itself. */
@Entity
@Table(name = "auth_tokens")
public class AuthToken {

    @Id
    @Column(name = "token_hash", length = 64)
    private String tokenHash;

    @Column(name = "teacher_id", nullable = false)
    private String teacherId;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    protected AuthToken() {}

    public AuthToken(String tokenHash, String teacherId, Instant expiresAt) {
        this.tokenHash = tokenHash;
        this.teacherId = teacherId;
        this.expiresAt = expiresAt;
    }

    public String getTokenHash() { return tokenHash; }
    public String getTeacherId() { return teacherId; }
    public Instant getExpiresAt() { return expiresAt; }
}
