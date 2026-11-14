package com.kaboom.service;

import com.kaboom.dto.QuestionSetDtos.QuestionDto;
import com.kaboom.dto.QuestionSetDtos.QuestionSetDto;
import com.kaboom.dto.RoomDtos.ActiveSkillView;
import com.kaboom.dto.RoomDtos.BossSkillView;
import com.kaboom.dto.RoomDtos.CreateRoomRequest;
import com.kaboom.dto.RoomDtos.PlayerView;
import com.kaboom.dto.RoomDtos.QuestionView;
import com.kaboom.dto.RoomDtos.ResultView;
import com.kaboom.dto.RoomDtos.RevealView;
import com.kaboom.dto.RoomDtos.RoomView;
import com.kaboom.exception.ApiException;
import com.kaboom.game.BossSkill;
import com.kaboom.game.GameRules;
import com.kaboom.game.PlayerSkill;
import com.kaboom.game.Room;
import com.kaboom.game.Room.Answer;
import com.kaboom.game.Room.Player;
import com.kaboom.game.Room.Result;
import com.kaboom.game.Room.Status;
import jakarta.annotation.PreDestroy;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Random;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Game rooms, held in memory (a backend restart ends every running game).
 *
 * Every method that changes a room locks that room, so answers arriving at the same moment
 * can't corrupt it. After each change the whole room view is pushed to /topic/rooms/{code}.
 */
@Service
public class RoomService {

    private static final long ROOM_MAX_IDLE_MS = 6L * 60 * 60 * 1000;

    private final Map<String, Room> rooms = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();
    private final Random dice = new Random();
    private final ScheduledExecutorService timers = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "kaboom-room-timer");
        t.setDaemon(true);
        return t;
    });
    private final SimpMessagingTemplate messaging;
    private final QuestionSetService questionSets;
    private final ResultService results;

    public RoomService(SimpMessagingTemplate messaging, QuestionSetService questionSets, ResultService results) {
        this.messaging = messaging;
        this.questionSets = questionSets;
        this.results = results;
    }

    @PreDestroy
    void shutdown() {
        timers.shutdownNow();
    }

    // ---------------------------------------------------------------- teacher

    public String create(String teacherId, CreateRoomRequest req) {
        QuestionSetDto set = questionSets.get(teacherId, req.questionSetId());
        if (set.questions().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ชุดคำถามนี้ยังไม่มีคำถาม");
        }
        purgeOldRooms();
        String code;
        do {
            code = String.valueOf(1000 + random.nextInt(9000));
        } while (rooms.containsKey(code));

        Room room = new Room(code, teacherId, set.name(), req.bossName().trim(), req.maxHp(), req.timeLimitSec(),
                List.copyOf(set.questions()));
        rooms.put(code, room);
        return code;
    }

    public void start(String code, String teacherId) {
        Room room = ownedRoom(code, teacherId);
        synchronized (room) {
            if (room.status != Status.LOBBY) throw new ApiException(HttpStatus.CONFLICT, "เกมเริ่มไปแล้ว");
            if (room.players.isEmpty()) throw new ApiException(HttpStatus.CONFLICT, "ยังไม่มีนักเรียนเข้าห้อง");
            openQuestion(room, 0);
            broadcast(room);
        }
    }

    /** Closes the current question now (the teacher pressed the button, or everyone has answered). */
    public void reveal(String code, String teacherId) {
        Room room = ownedRoom(code, teacherId);
        synchronized (room) {
            if (room.status != Status.QUESTION) throw new ApiException(HttpStatus.CONFLICT, "ตอนนี้ไม่ได้อยู่ระหว่างตอบคำถาม");
            revealLocked(room);
        }
    }

    public void next(String code, String teacherId) {
        Room room = ownedRoom(code, teacherId);
        synchronized (room) {
            if (room.status != Status.REVEAL) throw new ApiException(HttpStatus.CONFLICT, "ยังไปข้อถัดไปไม่ได้");
            boolean last = room.currentQ >= room.questions.size() - 1;
            if (room.hp <= 0 || last) {
                finish(room);
            } else {
                openQuestion(room, room.currentQ + 1);
            }
            broadcast(room);
        }
    }

    public void end(String code, String teacherId) {
        Room room = ownedRoom(code, teacherId);
        synchronized (room) {
            if (room.status == Status.ENDED) return;
            finish(room);
            broadcast(room);
        }
    }

    // ---------------------------------------------------------------- student

    public void join(String code, String studentId, String studentName) {
        Room room = require(code);
        synchronized (room) {
            boolean already = room.players.containsKey(studentId);
            if (!already && room.status != Status.LOBBY) {
                throw new ApiException(HttpStatus.CONFLICT, "เกมเริ่มไปแล้ว เข้าห้องนี้ไม่ได้");
            }
            if (!already) {
                room.addPlayer(studentId, studentName);
                touch(room);
                broadcast(room);
            }
        }
    }

    public void answer(String code, String studentId, int choice) {
        Room room = require(code);
        synchronized (room) {
            if (!room.players.containsKey(studentId)) throw new ApiException(HttpStatus.FORBIDDEN, "คุณไม่ได้อยู่ในห้องนี้");
            long now = System.currentTimeMillis();
            long myDeadline = room.deadlineMs + (room.activated.get(studentId) == PlayerSkill.EXTRA_TIME ? extraMs() : 0);
            if (room.status != Status.QUESTION || now > myDeadline + GameRules.GRACE_MS) {
                throw new ApiException(HttpStatus.CONFLICT, "หมดเวลาตอบข้อนี้แล้ว");
            }
            if (room.answers.containsKey(studentId)) throw new ApiException(HttpStatus.CONFLICT, "คุณตอบข้อนี้ไปแล้ว");

            long elapsed = Math.max(0, now - room.questionStartMs);
            room.answers.put(studentId, new Answer(choice, elapsed));
            touch(room);

            if (room.answers.size() >= room.players.size()) {
                revealLocked(room); // everyone has answered: no reason to wait for the clock
            } else {
                broadcast(room);
            }
        }
    }

    /** A student switches on the skill they are holding, for the question that is open now. */
    public void useSkill(String code, String studentId) {
        Room room = require(code);
        synchronized (room) {
            Player p = room.players.get(studentId);
            if (p == null) throw new ApiException(HttpStatus.FORBIDDEN, "คุณไม่ได้อยู่ในห้องนี้");
            if (room.status != Status.QUESTION) throw new ApiException(HttpStatus.CONFLICT, "ใช้สกิลได้เฉพาะตอนที่กำลังตอบคำถาม");
            if (room.answers.containsKey(studentId)) throw new ApiException(HttpStatus.CONFLICT, "ตอบข้อนี้ไปแล้ว ใช้สกิลไม่ได้");
            if (room.activated.containsKey(studentId)) throw new ApiException(HttpStatus.CONFLICT, "คุณใช้สกิลในข้อนี้ไปแล้ว");
            if (p.held == null) throw new ApiException(HttpStatus.CONFLICT, "คุณยังไม่มีสกิล");

            PlayerSkill skill = p.held;
            p.held = null;
            room.activated.put(studentId, skill);
            if (skill == PlayerSkill.EXTRA_TIME) {
                room.lastDeadlineMs = Math.max(room.lastDeadlineMs, room.deadlineMs + extraMs());
                scheduleAutoReveal(room); // the question must stay open until this student's extra time is up
            }
            touch(room);
            broadcast(room);
        }
    }

    // ---------------------------------------------------------------- read

    public RoomView view(String code) {
        Room room = require(code);
        synchronized (room) {
            return toView(room);
        }
    }

    // ---------------------------------------------------------------- internals (room already locked)

    private void openQuestion(Room room, int index) {
        cancelTimer(room);
        room.currentQ = index;
        room.status = Status.QUESTION;
        room.answers.clear();
        room.activated.clear();
        room.lastResults = new ArrayList<>();
        room.lastDamage = 0;
        room.bossHealed = 0;
        boolean bossJustActed = room.bossSkill != null;
        room.bossSkill = null;
        room.bossTargetId = null;
        room.questionLimitMs = room.timeLimitSec * 1000L;
        if (index > 0 && !bossJustActed) rollBossSkill(room);
        room.questionStartMs = System.currentTimeMillis();
        room.deadlineMs = room.questionStartMs + room.questionLimitMs;
        room.lastDeadlineMs = room.deadlineMs;
        touch(room);
        scheduleAutoReveal(room);
    }

    /** With some chance, the boss picks one skill it is allowed to use now. */
    private void rollBossSkill(Room room) {
        if (dice.nextDouble() >= GameRules.BOSS_SKILL_CHANCE) return;

        // "Watching you": the boss aims at the longest combo (most damage breaks a tie).
        Player leader = room.players.values().stream()
                .max(Comparator.comparingInt((Player p) -> p.combo).thenComparingInt(p -> p.totalDamage)).orElse(null);
        long shortened = Math.max(GameRules.SHORTEN_MIN_SEC * 1000L, Math.round(room.timeLimitSec * 1000L * GameRules.SHORTEN_FACTOR));
        int maxUses = GameRules.bossSkillUses(room.questions.size());

        List<BossSkill> options = new ArrayList<>();
        if (room.hp < room.maxHp && uses(room, BossSkill.HEAL) < maxUses) options.add(BossSkill.HEAL);
        if (shortened < room.questionLimitMs && uses(room, BossSkill.SHORTEN) < maxUses) options.add(BossSkill.SHORTEN);
        if (room.players.size() >= 2 && leader != null && leader.combo > 0
                && uses(room, BossSkill.NERF_TOP) < maxUses) options.add(BossSkill.NERF_TOP);
        if (options.isEmpty()) return;

        BossSkill pick = options.get(dice.nextInt(options.size()));
        room.bossSkill = pick;
        room.bossUses.merge(pick, 1, Integer::sum);
        if (pick == BossSkill.SHORTEN) room.questionLimitMs = shortened;
        if (pick == BossSkill.NERF_TOP) room.bossTargetId = leader.id;
    }

    private int uses(Room room, BossSkill skill) {
        return room.bossUses.getOrDefault(skill, 0);
    }

    /** (Re)schedules the automatic close of the current question at the last deadline anyone has. */
    private void scheduleAutoReveal(Room room) {
        if (room.timer != null) room.timer.cancel(false);
        final int idx = room.currentQ;
        long wait = Math.max(0, room.lastDeadlineMs - System.currentTimeMillis()) + GameRules.GRACE_MS;
        room.timer = timers.schedule(() -> {
            synchronized (room) {
                if (room.status == Status.QUESTION && room.currentQ == idx) revealLocked(room);
            }
        }, wait, TimeUnit.MILLISECONDS);
    }

    private static long extraMs() {
        return GameRules.EXTRA_TIME_SEC * 1000L;
    }

    private void revealLocked(Room room) {
        cancelTimer(room);
        QuestionDto q = room.questions.get(room.currentQ);
        long limitMs = room.questionLimitMs;

        List<Result> results = new ArrayList<>();
        int total = 0;
        for (Player p : room.players.values()) {
            Answer a = room.answers.get(p.id);
            boolean doubled = room.activated.get(p.id) == PlayerSkill.DOUBLE;
            boolean shielded = room.activated.get(p.id) == PlayerSkill.SHIELD;
            boolean nerfed = room.bossSkill == BossSkill.NERF_TOP && p.id.equals(room.bossTargetId) && !shielded;
            if (a == null) {
                if (!shielded) p.combo = 0;
                room.log.add(new Room.AnswerLog(room.currentQ, p.id, -1, false, 0));
                results.add(new Result(p.id, p.name, -1, false, 0, 0, doubled, nerfed, null, p.combo, shielded));
                continue;
            }
            boolean correct = a.choice() == q.correctIndex();
            int dmg = 0;
            if (correct) {
                p.combo++;
                double raw = GameRules.base(q.difficulty()) * GameRules.speedFactor(a.elapsedMs(), limitMs);
                raw *= 1 + GameRules.comboBonus(p.combo);
                if (doubled) raw *= GameRules.DOUBLE_FACTOR;
                if (nerfed) raw *= GameRules.NERF_FACTOR;
                dmg = (int) Math.round(raw);
                p.totalDamage += dmg;
                p.correctCount++;
                total += dmg;
            } else if (!shielded) {
                p.combo = 0;
            }
            room.log.add(new Room.AnswerLog(room.currentQ, p.id, a.choice(), correct, a.elapsedMs()));
            results.add(new Result(p.id, p.name, a.choice(), correct, dmg, a.elapsedMs(), doubled, nerfed, null, p.combo, shielded));
        }

        // A correct answer earns a random skill, but only for someone who is not already holding one.
        PlayerSkill[] all = PlayerSkill.values();
        List<Result> withEarned = new ArrayList<>();
        for (Result r : results) {
            PlayerSkill earned = null;
            if (r.correct()) {
                Player p = room.players.get(r.playerId());
                boolean milestone = p.combo > 0 && p.combo % GameRules.SKILL_COMBO_EVERY == 0;
                if (p.held == null && (milestone || dice.nextDouble() < GameRules.SKILL_DROP_CHANCE)) {
                    earned = all[dice.nextInt(all.length)];
                    p.held = earned;
                }
            }
            withEarned.add(new Result(r.playerId(), r.name(), r.choice(), r.correct(), r.damage(), r.elapsedMs(),
                    r.doubled(), r.nerfed(), earned, r.combo(), r.shielded()));
        }
        withEarned.sort(Comparator.comparingInt(Result::damage).reversed());

        room.hp = Math.max(0, room.hp - total);
        if (room.bossSkill == BossSkill.HEAL && room.hp > 0) {
            int heal = (int) Math.round(room.maxHp * GameRules.HEAL_FRACTION);
            int after = Math.min(room.maxHp, room.hp + heal);
            room.bossHealed = after - room.hp;
            room.hp = after;
        }

        room.lastResults = withEarned;
        room.lastDamage = total;
        room.status = Status.REVEAL;
        touch(room);
        broadcast(room);
    }

    private void finish(Room room) {
        cancelTimer(room);
        room.status = Status.ENDED;
        room.victory = room.hp <= 0;
        touch(room);
        // Keep the result for the students' dashboards (rooms themselves live in memory only).
        results.record(room);
    }

    private void cancelTimer(Room room) {
        if (room.timer != null) {
            room.timer.cancel(false);
            room.timer = null;
        }
    }

    private void touch(Room room) {
        room.lastActivityMs = System.currentTimeMillis();
    }

    private void broadcast(Room room) {
        messaging.convertAndSend("/topic/rooms/" + room.code, toView(room));
    }

    private RoomView toView(Room room) {
        QuestionView question = null;
        RevealView reveal = null;
        BossSkillView boss = null;
        if (room.status == Status.QUESTION || room.status == Status.REVEAL) {
            QuestionDto q = room.questions.get(room.currentQ);
            question = new QuestionView(q.text(), q.choices(), q.difficulty());
            if (room.bossSkill != null) {
                Player target = room.bossTargetId == null ? null : room.players.get(room.bossTargetId);
                boss = new BossSkillView(room.bossSkill.name(), room.bossTargetId, target == null ? null : target.name);
            }
            if (room.status == Status.REVEAL) {
                List<ResultView> rs = room.lastResults.stream()
                        .map(r -> new ResultView(r.playerId(), r.name(), r.choice(), r.correct(), r.damage(), r.elapsedMs(),
                                r.doubled(), r.nerfed(), r.earned() == null ? null : r.earned().name(), r.combo(), r.shielded()))
                        .toList();
                reveal = new RevealView(q.correctIndex(), room.lastDamage, room.bossHealed, rs);
            }
        }
        List<ActiveSkillView> active = (room.status == Status.QUESTION || room.status == Status.REVEAL)
                ? room.activated.entrySet().stream().map(e -> new ActiveSkillView(e.getKey(), e.getValue().name())).toList()
                : List.of();
        List<PlayerView> players = room.players.values().stream()
                .map(p -> new PlayerView(p.id, p.name, p.totalDamage, p.correctCount, p.held == null ? null : p.held.name(), p.combo))
                .sorted(Comparator.comparingInt(PlayerView::totalDamage).reversed())
                .toList();
        return new RoomView(
                room.code,
                room.teacherId,
                room.status.name(),
                room.bossName,
                room.hp,
                room.maxHp,
                room.setName,
                room.timeLimitSec,
                (int) (room.questionLimitMs / 1000),
                GameRules.EXTRA_TIME_SEC,
                room.currentQ,
                room.questions.size(),
                System.currentTimeMillis(),
                room.deadlineMs,
                question,
                room.status == Status.QUESTION ? new ArrayList<>(room.answers.keySet()) : List.of(),
                boss,
                active,
                reveal,
                room.status == Status.ENDED ? room.victory : null,
                players);
    }

    private Room require(String code) {
        Room room = rooms.get(code);
        if (room == null) throw new ApiException(HttpStatus.NOT_FOUND, "ไม่พบห้องรหัส " + code);
        return room;
    }

    private Room ownedRoom(String code, String teacherId) {
        Room room = require(code);
        if (!room.teacherId.equals(teacherId)) throw new ApiException(HttpStatus.FORBIDDEN, "นี่ไม่ใช่ห้องของคุณ");
        return room;
    }

    private void purgeOldRooms() {
        long cutoff = System.currentTimeMillis() - ROOM_MAX_IDLE_MS;
        rooms.values().removeIf(r -> r.lastActivityMs < cutoff);
    }
}
