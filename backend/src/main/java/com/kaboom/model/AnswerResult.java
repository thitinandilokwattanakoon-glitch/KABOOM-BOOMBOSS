package com.kaboom.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

/** What one student answered on one question of a finished game (for the teacher's report). */
@Entity
@Table(name = "answer_results", indexes = @Index(name = "idx_answer_results_game", columnList = "game_id"))
public class AnswerResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "game_id", nullable = false)
    private String gameId;

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "question_index", nullable = false)
    private int questionIndex;

    /** 0-3, or -1 when the student did not answer. */
    @Column(name = "choice", nullable = false)
    private int choice;

    @Column(name = "correct", nullable = false)
    private boolean correct;

    @Column(name = "elapsed_ms", nullable = false)
    private long elapsedMs;

    protected AnswerResult() {}

    public AnswerResult(String gameId, String studentId, int questionIndex, int choice, boolean correct, long elapsedMs) {
        this.gameId = gameId;
        this.studentId = studentId;
        this.questionIndex = questionIndex;
        this.choice = choice;
        this.correct = correct;
        this.elapsedMs = elapsedMs;
    }

    public String getGameId() { return gameId; }
    public String getStudentId() { return studentId; }
    public int getQuestionIndex() { return questionIndex; }
    public int getChoice() { return choice; }
    public boolean isCorrect() { return correct; }
    public long getElapsedMs() { return elapsedMs; }
}
