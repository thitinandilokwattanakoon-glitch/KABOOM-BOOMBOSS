package com.kaboom.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

/** How one student did in one finished game. */
@Entity
@Table(name = "player_results", indexes = {
        @Index(name = "idx_player_results_student", columnList = "student_id"),
        @Index(name = "idx_player_results_game", columnList = "game_id")})
public class PlayerResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "game_id", nullable = false)
    private String gameId;

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "player_name", nullable = false)
    private String name;

    @Column(name = "correct_count", nullable = false)
    private int correctCount;

    @Column(name = "total_damage", nullable = false)
    private int totalDamage;

    /** 1 = most damage in that game. */
    @Column(name = "place", nullable = false)
    private int place;

    @Column(name = "ended_at", nullable = false)
    private long endedAt;

    protected PlayerResult() {}

    public PlayerResult(String gameId, String studentId, String name, int correctCount, int totalDamage, int place, long endedAt) {
        this.gameId = gameId;
        this.studentId = studentId;
        this.name = name;
        this.correctCount = correctCount;
        this.totalDamage = totalDamage;
        this.place = place;
        this.endedAt = endedAt;
    }

    public Long getId() { return id; }
    public String getGameId() { return gameId; }
    public String getStudentId() { return studentId; }
    public String getName() { return name; }
    public int getCorrectCount() { return correctCount; }
    public int getTotalDamage() { return totalDamage; }
    public int getPlace() { return place; }
    public long getEndedAt() { return endedAt; }
}
