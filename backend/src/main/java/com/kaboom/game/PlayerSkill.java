package com.kaboom.game;

/** What a student can hold and use. */
public enum PlayerSkill {
    /** A correct answer on this question deals +50% damage. */
    DOUBLE,
    /** This student gets extra seconds on this question. */
    EXTRA_TIME,
    /** On this question a wrong answer does not break the combo, and the boss cannot halve this student's damage. */
    SHIELD
}
