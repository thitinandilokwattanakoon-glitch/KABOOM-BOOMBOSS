package com.kaboom.game;

import com.kaboom.model.Difficulty;

/**
 * All the numbers that decide how hard a correct answer hits the boss, in one place.
 *
 * Damage of one correct answer = base(difficulty) x speedFactor
 *   speedFactor goes in a straight line from MAX_SPEED (answered instantly)
 *   down to MIN_SPEED (answered right at the deadline).
 */
public final class GameRules {

    public static final int BASE_EASY = 20;
    public static final int BASE_MEDIUM = 30;
    public static final int BASE_HARD = 40;

    public static final double MAX_SPEED = 1.5;
    public static final double MIN_SPEED = 0.5;

    /** Answers that reach the server this long after the deadline are still accepted (network lag). */
    public static final long GRACE_MS = 800;

    public static final int DEFAULT_TIME_LIMIT_SEC = 20;
    public static final int MIN_TIME_LIMIT_SEC = 5;
    public static final int MAX_TIME_LIMIT_SEC = 120;

    public static final int DEFAULT_BOSS_HP = 1000;
    public static final int MIN_BOSS_HP = 10;
    public static final int MAX_BOSS_HP = 100_000;

    // Boss skills: before each question except the first, the boss may use one (chosen at random).
    // It never uses a skill on two questions in a row.
    public static final double BOSS_SKILL_CHANCE = 0.35;
    public static final int BOSS_SKILL_QUESTIONS_PER_USE = 5; // each skill: one use per this many questions in the set
    public static final int BOSS_SKILL_MIN_USES = 1;
    public static final int BOSS_SKILL_MAX_USES = 4;
    public static final double HEAL_FRACTION = 0.10; // of the full health of the boss
    public static final double SHORTEN_FACTOR = 0.5; // the question gets half its time...
    public static final int SHORTEN_MIN_SEC = 7; // ...but never less than this
    public static final double NERF_FACTOR = 0.5; // damage of the player with the longest combo, on that question

    // Student skills: one is held at a time; using it affects the current question only.
    public static final double DOUBLE_FACTOR = 1.5; // the power skill: +50% damage

    // Combo: correct answers in a row. Each one after the first adds COMBO_STEP, up to COMBO_MAX_BONUS (at combo x5).
    public static final double COMBO_STEP = 0.10;
    public static final double COMBO_MAX_BONUS = 0.40;
    public static final int EXTRA_TIME_SEC = 10;
    // A correct answer gives a skill (to someone holding none) with this chance, and always when the combo reaches a multiple of SKILL_COMBO_EVERY.
    public static final double SKILL_DROP_CHANCE = 0.35;
    public static final int SKILL_COMBO_EVERY = 3;

    private GameRules() {}

    public static int base(Difficulty d) {
        return switch (d) {
            case EASY -> BASE_EASY;
            case MEDIUM -> BASE_MEDIUM;
            case HARD -> BASE_HARD;
        };
    }

    public static double speedFactor(long elapsedMs, long limitMs) {
        double t = Math.min(1.0, Math.max(0.0, (double) elapsedMs / limitMs));
        return MAX_SPEED - (MAX_SPEED - MIN_SPEED) * t;
    }

    /** How many times the boss may use each skill in a game with this many questions. */
    public static int bossSkillUses(int questionCount) {
        return Math.max(BOSS_SKILL_MIN_USES, Math.min(BOSS_SKILL_MAX_USES, questionCount / BOSS_SKILL_QUESTIONS_PER_USE));
    }

    /** Extra damage for a combo of `combo` correct answers in a row, counting this one (1 = no bonus). */
    public static double comboBonus(int combo) {
        return Math.min(COMBO_MAX_BONUS, COMBO_STEP * Math.max(0, combo - 1));
    }

    public static int damage(Difficulty d, long elapsedMs, long limitMs) {
        return (int) Math.round(base(d) * speedFactor(elapsedMs, limitMs));
    }
}
