package com.kaboom.controller;

import com.kaboom.dto.OutfitDtos.OutfitDto;
import com.kaboom.service.CurrentStudent;
import com.kaboom.service.OutfitService;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

/**
 * PUT saves the dress-up character of the logged-in student.
 * GET needs no login, like the character pictures: everyone in a room draws the characters of everyone else.
 * It answers 204 (no content) for a student who has not dressed up yet.
 */
@RestController
public class OutfitController {

    private final OutfitService outfits;
    private final CurrentStudent student;

    public OutfitController(OutfitService outfits, CurrentStudent student) {
        this.outfits = outfits;
        this.student = student;
    }

    @PutMapping("/api/outfit")
    public OutfitDto save(@RequestHeader(value = "Authorization", required = false) String auth,
                          @Valid @RequestBody OutfitDto req) {
        return outfits.save(student.from(auth).getId(), req);
    }

    @GetMapping("/api/outfits/{studentId}")
    public ResponseEntity<OutfitDto> get(@PathVariable String studentId) {
        return outfits.find(studentId)
                .map(o -> ResponseEntity.ok().cacheControl(CacheControl.noCache()).body(o))
                .orElseGet(() -> ResponseEntity.noContent().cacheControl(CacheControl.noCache()).build());
    }
}
