package com.kaboom.dto;

import com.kaboom.model.Difficulty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public class QuestionSetDtos {

    public record QuestionDto(
            @NotBlank(message = "กรอกโจทย์คำถามให้ครบทุกข้อ")
            @Size(max = 500, message = "โจทย์ยาวไม่เกิน 500 ตัวอักษร")
            String text,

            @NotNull(message = "ต้องมี 4 ตัวเลือก")
            @Size(min = 4, max = 4, message = "ต้องมี 4 ตัวเลือก")
            List<@NotBlank(message = "กรอกตัวเลือกให้ครบ 4 ข้อ") @Size(max = 200, message = "ตัวเลือกยาวไม่เกิน 200 ตัวอักษร") String> choices,

            @Min(value = 0, message = "เลือกคำตอบที่ถูก") @Max(value = 3, message = "เลือกคำตอบที่ถูก")
            int correctIndex,

            @NotNull(message = "เลือกระดับความยาก")
            Difficulty difficulty) {}

    public record QuestionSetRequest(
            @NotBlank(message = "ตั้งชื่อชุดคำถาม")
            @Size(max = 100, message = "ชื่อชุดยาวไม่เกิน 100 ตัวอักษร")
            String name,

            @NotNull(message = "ต้องมีอย่างน้อย 1 คำถาม")
            @Size(min = 1, max = 100, message = "ชุดคำถามมีได้ 1-100 ข้อ")
            List<@Valid QuestionDto> questions) {}

    public record QuestionSetDto(String id, String name, List<QuestionDto> questions, Instant updatedAt) {}

    public record QuestionSetSummary(String id, String name, int questionCount, Instant updatedAt) {}
}
