package com.kaboom.controller;

import com.kaboom.model.BossLook;
import com.kaboom.repository.BossLookRepository;
import com.kaboom.service.CurrentTeacher;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

/**
 * PUT saves how the logged-in teacher dressed their boss.
 * GET needs no login: every player in a room draws the boss. It answers 204 when nothing was saved yet.
 */
@RestController
public class BossLookController {

    /** The look as JSON text. Only letters, digits and JSON punctuation, so it is safe to store and send back. */
    public record BossLookDto(
            @NotBlank(message = "ข้อมูลตัวละครบอสไม่ถูกต้อง")
            @Size(max = 16000, message = "ข้อมูลตัวละครบอสยาวเกินไป")
            @Pattern(regexp = "[A-Za-z0-9{}\":,;_\\-\\s]*", message = "ข้อมูลตัวละครบอสไม่ถูกต้อง")
            String look) {}

    private final BossLookRepository looks;
    private final CurrentTeacher teacher;

    public BossLookController(BossLookRepository looks, CurrentTeacher teacher) {
        this.looks = looks;
        this.teacher = teacher;
    }

    @PutMapping("/api/boss-look")
    public BossLookDto save(@RequestHeader(value = "Authorization", required = false) String auth,
                            @Valid @RequestBody BossLookDto req) {
        String id = teacher.from(auth).getId();
        BossLook saved = looks.findById(id).orElseGet(() -> new BossLook(id, req.look()));
        saved.wear(req.look());
        return new BossLookDto(looks.save(saved).getLook());
    }

    @GetMapping("/api/boss-looks/{teacherId}")
    public ResponseEntity<BossLookDto> get(@PathVariable String teacherId) {
        return looks.findById(teacherId)
                .map(l -> ResponseEntity.ok().cacheControl(CacheControl.noCache()).body(new BossLookDto(l.getLook())))
                .orElseGet(() -> ResponseEntity.noContent().cacheControl(CacheControl.noCache()).build());
    }
}
