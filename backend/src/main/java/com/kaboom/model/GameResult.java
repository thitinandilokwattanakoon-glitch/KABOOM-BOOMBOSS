package com.kaboom.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.util.UUID;

/** One finished game. The questions are copied here so students can practise them later, even if the set changes. */
@Entity
@Table(name = "game_results")
public class GameResult {

    @Id
    private String id = UUID.randomUUID().toString();

    @Column(name = "teacher_id", nullable = false)
    private String teacherId;

    @Column(name = "set_name", nullable = false, length = 100)
    private String setName;

    @Column(name = "boss_name", nullable = false, length = 40)
    private String bossName;

    @Column(nullable = false)
    private boolean victory;

    /** Questions that were actually asked (a game can end early when the boss is beaten). */
    @Column(name = "question_count", nullable = false)
    private int questionCount;

    @Column(name = "player_count", nullable = false)
    private int playerCount;

    @Column(name = "ended_at", nullable = false)
    private long endedAt;

    /** JSON list of the whole question set (text, choices, correctIndex, difficulty). */
    @Lob
    @Column(name = "questions_json", nullable = false)
    private String questionsJson;

    protected GameResult() {}

    public GameResult(String teacherId, String setName, String bossName, boolean victory, int questionCount,
                      int playerCount, String questionsJson) {
        this.teacherId = teacherId;
        this.setName = setName;
        this.bossName = bossName;
        this.victory = victory;
        this.questionCount = questionCount;
        this.playerCount = playerCount;
        this.questionsJson = questionsJson;
        this.endedAt = System.currentTimeMillis();
    }

    public String getId() { return id; }
    public String getTeacherId() { return teacherId; }
    public String getSetName() { return setName; }
    public String getBossName() { return bossName; }
    public boolean isVictory() { return victory; }
    public int getQuestionCount() { return questionCount; }
    public int getPlayerCount() { return playerCount; }
    public long getEndedAt() { return endedAt; }
    public String getQuestionsJson() { return questionsJson; }
}
