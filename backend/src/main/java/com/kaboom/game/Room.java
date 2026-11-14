package com.kaboom.game;

import com.kaboom.dto.QuestionSetDtos.QuestionDto;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ScheduledFuture;

/** One live game room. Lives in memory only; every access goes through RoomService (which locks the room). */
public class Room {

    public enum Status { LOBBY, QUESTION, REVEAL, ENDED }

    public static class Player {
        public final String id;
        public final String name;
        public int totalDamage;
        public int correctCount;
        /** Correct answers in a row right now. */
        public int combo;
        /** The skill this student is holding (null = none). */
        public PlayerSkill held;

        Player(String id, String name) {
            this.id = id;
            this.name = name;
        }
    }

    public record Answer(int choice, long elapsedMs) {}

    /** One line of the game log, kept for the teacher's report: who answered what on which question. choice -1 = no answer. */
    public record AnswerLog(int questionIndex, String playerId, int choice, boolean correct, long elapsedMs) {}

    public record Result(String playerId, String name, int choice, boolean correct, int damage, long elapsedMs,
                         boolean doubled, boolean nerfed, PlayerSkill earned, int combo, boolean shielded) {}

    public final String code;
    public final String teacherId;
    public final String setName;
    public final String bossName;
    public final int maxHp;
    public final int timeLimitSec;
    public final List<QuestionDto> questions;
    public final Map<String, Player> players = new LinkedHashMap<>();

    public int hp;
    public Status status = Status.LOBBY;
    public int currentQ = -1;
    public long questionStartMs;
    /** Normal deadline of the current question. */
    public long deadlineMs;
    /** Latest deadline anyone has (later than deadlineMs when somebody used extra time). */
    public long lastDeadlineMs;
    /** Length of the current question (shorter than timeLimitSec when the boss shortened it). */
    public long questionLimitMs;
    public final Map<String, Answer> answers = new LinkedHashMap<>();
    /** Skills students switched on for the current question. */
    public final Map<String, PlayerSkill> activated = new LinkedHashMap<>();

    public BossSkill bossSkill;
    public String bossTargetId;
    public int bossHealed;
    public final Map<BossSkill, Integer> bossUses = new EnumMap<>(BossSkill.class);

    public final List<AnswerLog> log = new ArrayList<>();
    public List<Result> lastResults = new ArrayList<>();
    public int lastDamage;
    public boolean victory;
    public ScheduledFuture<?> timer;
    public long lastActivityMs = System.currentTimeMillis();

    public Room(String code, String teacherId, String setName, String bossName, int maxHp, int timeLimitSec,
                List<QuestionDto> questions) {
        this.code = code;
        this.teacherId = teacherId;
        this.setName = setName;
        this.bossName = bossName;
        this.maxHp = maxHp;
        this.hp = maxHp;
        this.timeLimitSec = timeLimitSec;
        this.questions = questions;
    }

    public Player addPlayer(String id, String name) {
        return players.computeIfAbsent(id, k -> new Player(id, name));
    }
}
