package com.kaboom.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** A teacher's named set of questions that can be reused for many rooms. */
@Entity
@Table(name = "question_sets", indexes = @Index(name = "idx_question_sets_teacher", columnList = "teacher_id"))
public class QuestionSet {

    @Id
    private String id = UUID.randomUUID().toString();

    @Column(name = "teacher_id", nullable = false)
    private String teacherId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "question_set_id")
    @OrderColumn(name = "sort_order")
    private List<Question> questions = new ArrayList<>();

    protected QuestionSet() {}

    public QuestionSet(String teacherId, String name) {
        this.teacherId = teacherId;
        this.name = name;
    }

    public String getId() { return id; }
    public String getTeacherId() { return teacherId; }
    public String getName() { return name; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public List<Question> getQuestions() { return questions; }

    public void rename(String newName) { this.name = newName; }
    public void touch() { this.updatedAt = Instant.now(); }

    /** Replaces the whole question list (old rows are deleted by orphanRemoval). */
    public void replaceQuestions(List<Question> replacement) {
        questions.clear();
        questions.addAll(replacement);
    }
}
