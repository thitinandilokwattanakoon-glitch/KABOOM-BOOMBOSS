package com.kaboom.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;

public final class ResultDtos {
    private ResultDtos() {}

    /** One card on the dashboard: a game the student played. */
    public record GameCard(String gameId, String setName, String bossName, boolean victory, int questionCount,
                           int correctCount, int totalDamage, int place, int playerCount, long endedAt) {}

    public record BoardRow(int place, String studentId, String name, int correctCount, int totalDamage) {}

    /** The detail page of one game: the card, the ranking and how many questions the solo practice has. */
    public record GameDetail(GameCard game, List<BoardRow> board, int practiceCount) {}

    // ---- the teacher's report

    /** One finished game in the teacher's list. */
    public record TeacherGame(String gameId, String setName, String bossName, boolean victory, int questionCount,
                              int playerCount, long endedAt) {}

    /** One student in the report. percent = correct answers out of the questions asked; avgMs = average time of the answers given (0 = never answered). */
    public record ReportPlayer(int place, String studentId, String name, int correctCount, int wrongCount, int skippedCount,
                               int percent, int totalDamage, long avgMs) {}

    /** One question in the report: how the class did on it. `picks` = how many chose each of the four choices. */
    public record ReportQuestion(int index, String text, List<String> choices, int correctIndex, int right, int wrong,
                                 int skipped, List<Integer> picks) {}

    /** hasAnswers is false for games played before answers were kept: then only the ranking is known. */
    public record TeacherReport(TeacherGame game, int right, int wrong, int skipped, boolean hasAnswers,
                                List<ReportPlayer> players, List<ReportQuestion> questions) {}

    /** A practice question, without the answer. */
    public record PracticeQuestion(String text, List<String> choices) {}

    public record PracticeAnswer(@Min(0) @Max(3) int choice) {}

    public record PracticeCheck(boolean correct, int correctIndex) {}
}
