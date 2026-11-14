package com.kaboom.service;

import com.kaboom.dto.AuthDtos.AuthResponse;
import com.kaboom.dto.AuthDtos.LoginRequest;
import com.kaboom.dto.AuthDtos.RegisterRequest;
import com.kaboom.dto.AuthDtos.TeacherDto;
import com.kaboom.exception.ApiException;
import com.kaboom.model.AuthToken;
import com.kaboom.model.Teacher;
import com.kaboom.repository.AuthTokenRepository;
import com.kaboom.repository.TeacherRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final TeacherRepository teachers;
    private final AuthTokenRepository tokens;
    private final PasswordEncoder encoder;
    private final Duration tokenLife;
    private final Duration sessionLife;

    public AuthService(TeacherRepository teachers,
                       AuthTokenRepository tokens,
                       PasswordEncoder encoder,
                       @Value("${app.auth.token-days:30}") long tokenDays,
                       @Value("${app.auth.session-hours:12}") long sessionHours) {
        this.teachers = teachers;
        this.tokens = tokens;
        this.encoder = encoder;
        this.tokenLife = Duration.ofDays(tokenDays);
        this.sessionLife = Duration.ofHours(sessionHours);
    }

    public AuthResponse register(RegisterRequest req) {
        String email = normalize(req.email());
        if (teachers.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "อีเมลนี้ถูกใช้สมัครแล้ว");
        }
        Teacher t = teachers.save(new Teacher(email, req.displayName().trim(), encoder.encode(req.password())));
        return new AuthResponse(issueToken(t, tokenLife), toDto(t));
    }

    public AuthResponse login(LoginRequest req) {
        // Same message for "no such email" and "wrong password" so emails can't be probed.
        Teacher t = teachers.findByEmail(normalize(req.email()))
                .filter(x -> encoder.matches(req.password(), x.getPasswordHash()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "อีเมลหรือรหัสผ่านไม่ถูกต้อง"));
        return new AuthResponse(issueToken(t, Boolean.TRUE.equals(req.remember()) ? tokenLife : sessionLife), toDto(t));
    }

    /** Returns the teacher for a valid, unexpired token, or empty. */
    public Optional<Teacher> authenticate(String token) {
        if (token == null || token.isBlank()) return Optional.empty();
        return tokens.findById(hash(token))
                .filter(t -> t.getExpiresAt().isAfter(Instant.now()))
                .flatMap(t -> teachers.findById(t.getTeacherId()));
    }

    public Teacher requireTeacher(String token) {
        return authenticate(token)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "กรุณาเข้าสู่ระบบใหม่"));
    }

    public void logout(String token) {
        if (token == null || token.isBlank()) return;
        tokens.deleteById(hash(token));
    }

    public TeacherDto toDto(Teacher t) {
        return new TeacherDto(t.getId(), t.getEmail(), t.getDisplayName());
    }

    private String issueToken(Teacher t, Duration life) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        tokens.save(new AuthToken(hash(token), t.getId(), Instant.now().plus(life)));
        return token;
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String hash(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
