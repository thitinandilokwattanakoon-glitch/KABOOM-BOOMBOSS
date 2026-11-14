package com.kaboom.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaboom.dto.QuestionSetDtos.QuestionDto;
import com.kaboom.dto.ResultDtos.BoardRow;
import com.kaboom.dto.ResultDtos.GameCard;
import com.kaboom.dto.ResultDtos.GameDetail;
import com.kaboom.dto.ResultDtos.PracticeCheck;
import com.kaboom.dto.ResultDtos.PracticeQuestion;
import com.kaboom.dto.ResultDtos.ReportPlayer;
import com.kaboom.dto.ResultDtos.ReportQuestion;
import com.kaboom.dto.ResultDtos.TeacherGame;
import com.kaboom.dto.ResultDtos.TeacherReport;
import com.kaboom.exception.ApiException;
import com.kaboom.game.Room;
import com.kaboom.model.AnswerResult;
import com.kaboom.model.GameResult;
import com.kaboom.model.PlayerResult;
import com.kaboom.repository.AnswerResultRepository;
import com.kaboom.repository.GameResultRepository;
import com.kaboom.repository.PlayerResultRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Finished games, kept for the student dashboard: who played, how they did, and a copy of the questions
 * so a student can practise them alone afterwards.
 */
@Service
public class ResultService {

    private static final Logger log = LoggerFactory.getLogger(ResultService.class);

    private final GameResultRepository games;
    private final PlayerResultRepository players;
    private final AnswerResultRepository answers;
    private final ObjectMapper json;

    public ResultService(GameResultRepository games, PlayerResultRepository players, AnswerResultRepository answers, ObjectMapper json) {
        this.games = games;
        this.players = players;
        this.answers = answers;
        this.json = json;
    }

    /** Called once when a room ends. A failure here must never break the game, so it is only logged. */
    public void record(Room room) {
        try {
            if (room.currentQ < 0 || room.players.isEmpty()) return; // ended before it started
            GameResult game = games.save(new GameResult(room.teacherId, room.setName, room.bossName, room.victory,
                    room.currentQ + 1, room.players.size(), json.writeValueAsString(room.questions)));
            List<Room.Player> order = new ArrayList<>(room.players.values());
            order.sort(Comparator.comparingInt((Room.Player p) -> p.totalDamage).reversed());
            List<PlayerResult> rows = new ArrayList<>();
            for (int i = 0; i < order.size(); i++) {
                Room.Player p = order.get(i);
                rows.add(new PlayerResult(game.getId(), p.id, p.name, p.correctCount, p.totalDamage, i + 1, game.getEndedAt()));
            }
            players.saveAll(rows);
            answers.saveAll(room.log.stream()
                    .map(l -> new AnswerResult(game.getId(), l.playerId(), l.questionIndex(), l.choice(), l.correct(), l.elapsedMs()))
                    .toList());
        } catch (Exception e) {
            log.error("Could not save the result of room {}: {}", room.code, e.getMessage());
        }
    }

    /** The games a student played, newest first. */
    public List<GameCard> listFor(String studentId) {
        List<PlayerResult> mine = players.findTop60ByStudentIdOrderByEndedAtDesc(studentId);
        Map<String, GameResult> byId = games.findAllById(mine.stream().map(PlayerResult::getGameId).toList()).stream()
                .collect(Collectors.toMap(GameResult::getId, Function.identity()));
        return mine.stream()
                .filter(r -> byId.containsKey(r.getGameId()))
                .map(r -> card(byId.get(r.getGameId()), r))
                .toList();
    }

    public GameDetail detail(String studentId, String gameId) {
        PlayerResult mine = mine(studentId, gameId);
        GameResult game = game(gameId);
        List<BoardRow> board = players.findByGameIdOrderByPlaceAsc(gameId).stream()
                .map(r -> new BoardRow(r.getPlace(), r.getStudentId(), r.getName(), r.getCorrectCount(), r.getTotalDamage()))
                .toList();
        return new GameDetail(card(game, mine), board, questions(game).size());
    }

    /** The questions of a game the student played, without the answers. */
    public List<PracticeQuestion> practice(String studentId, String gameId) {
        mine(studentId, gameId);
        return questions(game(gameId)).stream().map(q -> new PracticeQuestion(q.text(), q.choices())).toList();
    }

    public PracticeCheck check(String studentId, String gameId, int index, int choice) {
        mine(studentId, gameId);
        List<QuestionDto> list = questions(game(gameId));
        if (index < 0 || index >= list.size()) throw new ApiException(HttpStatus.NOT_FOUND, "ไม่พบคำถามข้อนี้");
        int right = list.get(index).correctIndex();
        return new PracticeCheck(choice == right, right);
    }

    // ---------------------------------------------------------------- teacher

    /** The games a teacher ran, newest first. */
    public List<TeacherGame> gamesOf(String teacherId) {
        return games.findTop60ByTeacherIdOrderByEndedAtDesc(teacherId).stream().map(ResultService::teacherGame).toList();
    }

    /** The full report of one game: ranking by share of correct answers (damage breaks a tie) and every question. */
    public TeacherReport report(String teacherId, String gameId) {
        GameResult game = game(gameId);
        if (!game.getTeacherId().equals(teacherId)) throw new ApiException(HttpStatus.NOT_FOUND, "ไม่พบผลเกมนี้");
        List<AnswerResult> log = answers.findByGameId(gameId);
        List<QuestionDto> qs = questions(game);
        int asked = game.getQuestionCount();

        List<ReportPlayer> rows = new ArrayList<>();
        for (PlayerResult p : players.findByGameIdOrderByPlaceAsc(gameId)) {
            List<AnswerResult> mine = log.stream().filter(a -> a.getStudentId().equals(p.getStudentId())).toList();
            int wrong = (int) mine.stream().filter(a -> a.getChoice() >= 0 && !a.isCorrect()).count();
            long answered = mine.stream().filter(a -> a.getChoice() >= 0).count();
            long avg = answered == 0 ? 0 : mine.stream().filter(a -> a.getChoice() >= 0).mapToLong(AnswerResult::getElapsedMs).sum() / answered;
            int skipped = log.isEmpty() ? 0 : Math.max(0, asked - p.getCorrectCount() - wrong);
            int percent = asked == 0 ? 0 : Math.round(p.getCorrectCount() * 100f / asked);
            rows.add(new ReportPlayer(0, p.getStudentId(), p.getName(), p.getCorrectCount(), wrong, skipped, percent, p.getTotalDamage(), avg));
        }
        rows.sort(Comparator.comparingInt(ReportPlayer::percent).thenComparingInt(ReportPlayer::totalDamage).reversed());
        List<ReportPlayer> ranked = new ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            ReportPlayer r = rows.get(i);
            ranked.add(new ReportPlayer(i + 1, r.studentId(), r.name(), r.correctCount(), r.wrongCount(), r.skippedCount(), r.percent(), r.totalDamage(), r.avgMs()));
        }

        List<ReportQuestion> perQuestion = new ArrayList<>();
        for (int i = 0; i < Math.min(asked, qs.size()); i++) {
            final int index = i;
            List<AnswerResult> on = log.stream().filter(a -> a.getQuestionIndex() == index).toList();
            List<Integer> picks = new ArrayList<>(List.of(0, 0, 0, 0));
            on.stream().filter(a -> a.getChoice() >= 0 && a.getChoice() < 4).forEach(a -> picks.set(a.getChoice(), picks.get(a.getChoice()) + 1));
            int right = (int) on.stream().filter(AnswerResult::isCorrect).count();
            int skipped = (int) on.stream().filter(a -> a.getChoice() < 0).count();
            QuestionDto q = qs.get(i);
            perQuestion.add(new ReportQuestion(i, q.text(), q.choices(), q.correctIndex(), right, on.size() - right - skipped, skipped, picks));
        }
        int right = (int) log.stream().filter(AnswerResult::isCorrect).count();
        int skipped = (int) log.stream().filter(a -> a.getChoice() < 0).count();
        return new TeacherReport(teacherGame(game), right, log.size() - right - skipped, skipped, !log.isEmpty(), ranked, perQuestion);
    }

    private static TeacherGame teacherGame(GameResult g) {
        return new TeacherGame(g.getId(), g.getSetName(), g.getBossName(), g.isVictory(), g.getQuestionCount(), g.getPlayerCount(), g.getEndedAt());
    }

    private PlayerResult mine(String studentId, String gameId) {
        return players.findFirstByGameIdAndStudentId(gameId, studentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ไม่พบผลเกมนี้"));
    }

    private GameResult game(String gameId) {
        return games.findById(gameId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ไม่พบผลเกมนี้"));
    }

    private List<QuestionDto> questions(GameResult game) {
        try {
            return json.readValue(game.getQuestionsJson(), new TypeReference<List<QuestionDto>>() {});
        } catch (Exception e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "อ่านคำถามของเกมนี้ไม่ได้");
        }
    }

    private static GameCard card(GameResult g, PlayerResult r) {
        return new GameCard(g.getId(), g.getSetName(), g.getBossName(), g.isVictory(), g.getQuestionCount(),
                r.getCorrectCount(), r.getTotalDamage(), r.getPlace(), g.getPlayerCount(), g.getEndedAt());
    }
}
