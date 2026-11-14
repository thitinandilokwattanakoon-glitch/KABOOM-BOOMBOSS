package com.kaboom.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

/** A character picture. The id is the owner's id (a teacher's or a student's), so each account has at most one. */
@Entity
@Table(name = "avatars")
public class Avatar {

    @Id
    private String id;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Lob
    @Column(nullable = false)
    private byte[] data;

    @Column(name = "updated_at", nullable = false)
    private long updatedAt;

    protected Avatar() {}

    public Avatar(String id, String contentType, byte[] data) {
        this.id = id;
        this.contentType = contentType;
        this.data = data;
        this.updatedAt = System.currentTimeMillis();
    }

    public void replace(String contentType, byte[] data) {
        this.contentType = contentType;
        this.data = data;
        this.updatedAt = System.currentTimeMillis();
    }

    public String getId() { return id; }
    public String getContentType() { return contentType; }
    public byte[] getData() { return data; }
    public long getUpdatedAt() { return updatedAt; }
}
