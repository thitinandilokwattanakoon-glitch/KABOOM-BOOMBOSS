package com.kaboom.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class OutfitDtos {
    private OutfitDtos() {}

    private static final String ITEM = "[a-z0-9-]{1,24}";
    private static final String BAD = "ข้อมูลตัวละครไม่ถูกต้อง";

    /** The same shape is used to save and to read the outfit of a character. */
    public record OutfitDto(
            @Min(value = 0, message = BAD) @Max(value = 31, message = BAD) int skin,
            @NotNull(message = BAD) @Pattern(regexp = ITEM, message = BAD) String face,
            @NotNull(message = BAD) @Pattern(regexp = ITEM, message = BAD) String hair,
            @Min(value = 0, message = BAD) @Max(value = 31, message = BAD) int hairColor,
            @NotNull(message = BAD) @Pattern(regexp = ITEM, message = BAD) String hat,
            @Min(value = 0, message = BAD) @Max(value = 31, message = BAD) int hatColor,
            @NotNull(message = BAD) @Pattern(regexp = ITEM, message = BAD) String top,
            @Min(value = 0, message = BAD) @Max(value = 31, message = BAD) int topColor,
            @NotNull(message = BAD) @Pattern(regexp = ITEM, message = BAD) String bottom,
            @Min(value = 0, message = BAD) @Max(value = 31, message = BAD) int bottomColor,
            @NotNull(message = BAD) @Pattern(regexp = ITEM, message = BAD) String shoes,
            @Min(value = 0, message = BAD) @Max(value = 31, message = BAD) int shoesColor,
            @NotNull(message = BAD) @Pattern(regexp = ITEM, message = BAD) String accessory,
            @Min(value = 0, message = BAD) @Max(value = 31, message = BAD) int accessoryColor,
            @NotNull(message = BAD) @Pattern(regexp = ITEM, message = BAD) String bag,
            @Min(value = 0, message = BAD) @Max(value = 31, message = BAD) int bagColor,
            @Size(max = 12000, message = "ภาพหน้าที่วาดมีเส้นมากเกินไป ลองลบบางเส้นออก")
            @Pattern(regexp = "[0-9,;]*", message = BAD) String faceArt) {}
}
