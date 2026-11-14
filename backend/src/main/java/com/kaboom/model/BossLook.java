package com.kaboom.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * How a teacher dressed their boss. The id is the teacher id, so each teacher has at most one.
 * The look is a small JSON text; the frontend (game/avatar.ts) knows the items and falls back to
 * the default for anything it does not recognise.
 */
@Entity
@Table(name = "boss_looks")
public class BossLook {

    @Id
    private String id;

    @Column(name = "look", nullable = false, length = 16000)
    private String look;

    @Column(name = "updated_at", nullable = false)
    private long updatedAt;

    protected BossLook() {}

    public BossLook(String teacherId, String look) {
        this.id = teacherId;
        wear(look);
    }

    public void wear(String look) {
        this.look = look;
        this.updatedAt = System.currentTimeMillis();
    }

    public String getId() { return id; }
    public String getLook() { return look; }
    public long getUpdatedAt() { return updatedAt; }
}
