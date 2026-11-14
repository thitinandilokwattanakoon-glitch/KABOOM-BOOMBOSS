package com.kaboom.dto;

import jakarta.validation.constraints.NotBlank;

public final class AvatarDtos {
    private AvatarDtos() {}

    /** A data URL such as "data:image/jpeg;base64,/9j/4AAQ...". */
    public record AvatarRequest(@NotBlank(message = "กรุณาเลือกรูป") String image) {}
}
