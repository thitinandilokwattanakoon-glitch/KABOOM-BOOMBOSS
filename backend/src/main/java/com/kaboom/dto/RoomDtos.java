package com.kaboom.dto;

import com.kaboom.model.Difficulty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class RoomDtos {
    private RoomDtos() {}

    public record CreateRoomRequest(
            @NotBlank(message = "กรุณาเลือกชุดคำถาม") String questionSetId,
            @NotBlank(message = "กรุณาตั้งชื่อบอส") @Size(max = 40, message = "ชื่อบอสยาวเกิน 40 ตัวอักษร") String bossName,
            @Min(value = 10, message = "เลือดบอสต้องอย่างน้อย 10") @Max(value = 100000, message = "เลือดบอสต้องไม่เกิน 100,000") int maxHp,
            @Min(value = 5, message = "เวลาต่อข้อต้องอย่างน้อย 5 วินาที") @Max(value = 120, message = "เวลาต่อข้อต้องไม่เกิน 120 วินาที") int timeLimitSec) {}

    public record AnswerRequest(@Min(0) @Max(3) int choice) {}

    public record CreateRoomResponse(String code) {}

    /** skill = the skill this player is holding right now (null = none). */
    public record PlayerView(String id, String name, int totalDamage, int correctCount, String skill, int combo) {}

    /** What the boss did this question. targetId/targetName only for NERF_TOP. */
    public record BossSkillView(String type, String targetId, String targetName) {}

    /** A student skill switched on for this question. */
    public record ActiveSkillView(String playerId, String skill) {}

    /** The question as players see it while it is open: no correct answer. */
    public record QuestionView(String text, List<String> choices, Difficulty difficulty) {}

    public record ResultView(String playerId, String name, int choice, boolean correct, int damage, long elapsedMs,
                             boolean doubled, boolean nerfed, String earned, int combo, boolean shielded) {}

    public record RevealView(int correctIndex, int totalDamage, int healed, List<ResultView> results) {}

    /** Sent to everybody in the room on every change (and returned by GET /api/rooms/{code}). */
    public record RoomView(
            String code,
            String teacherId,
            String status,
            String bossName,
            int hp,
            int maxHp,
            String setName,
            int timeLimitSec,
            int questionLimitSec,
            int extraTimeSec,
            int questionIndex,
            int questionCount,
            long serverNowMs,
            long deadlineMs,
            QuestionView question,
            List<String> answeredIds,
            BossSkillView bossSkill,
            List<ActiveSkillView> activeSkills,
            RevealView reveal,
            Boolean victory,
            List<PlayerView> players) {}
}
