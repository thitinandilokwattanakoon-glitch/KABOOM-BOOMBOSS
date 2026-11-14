package com.kaboom.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.List;

/** One multiple-choice question: exactly 4 choices, one correct. */
@Entity
@Table(name = "questions")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "question_text", nullable = false, length = 500)
    private String text;

    @Column(name = "choice_0", nullable = false, length = 200)
    private String choice0;
    @Column(name = "choice_1", nullable = false, length = 200)
    private String choice1;
    @Column(name = "choice_2", nullable = false, length = 200)
    private String choice2;
    @Column(name = "choice_3", nullable = false, length = 200)
    private String choice3;

    @Column(name = "correct_index", nullable = false)
    private int correctIndex;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Difficulty difficulty;

    protected Question() {}

    public Question(String text, List<String> choices, int correctIndex, Difficulty difficulty) {
        this.text = text;
        this.choice0 = choices.get(0);
        this.choice1 = choices.get(1);
        this.choice2 = choices.get(2);
        this.choice3 = choices.get(3);
        this.correctIndex = correctIndex;
        this.difficulty = difficulty;
    }

    public Long getId() { return id; }
    public String getText() { return text; }
    public List<String> getChoices() { return List.of(choice0, choice1, choice2, choice3); }
    public int getCorrectIndex() { return correctIndex; }
    public Difficulty getDifficulty() { return difficulty; }
}
