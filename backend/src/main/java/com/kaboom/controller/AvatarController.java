package com.kaboom.controller;

import com.kaboom.dto.AvatarDtos.AvatarRequest;
import com.kaboom.model.Avatar;
import com.kaboom.service.AvatarService;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

/**
 * PUT saves the logged-in user's own picture (teacher or student token).
 * GET needs no login: pictures are shown with plain img tags, which cannot send a token.
 * The ids in the address are random UUIDs, so they can't be guessed.
 */
@RestController
public class AvatarController {

    private final AvatarService avatars;

    public AvatarController(AvatarService avatars) {
        this.avatars = avatars;
    }

    @PutMapping("/api/avatar")
    public ResponseEntity<Void> save(@RequestHeader(value = "Authorization", required = false) String auth,
                                     @Valid @RequestBody AvatarRequest req) {
        avatars.save(avatars.ownerId(auth), req.image());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/avatars/{ownerId}")
    public ResponseEntity<byte[]> get(@PathVariable String ownerId) {
        Avatar a = avatars.find(ownerId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(a.getContentType()))
                .eTag("\"" + a.getUpdatedAt() + "\"")
                .cacheControl(CacheControl.noCache())
                .body(a.getData());
    }
}
