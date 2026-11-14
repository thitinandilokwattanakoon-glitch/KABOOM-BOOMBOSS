package com.kaboom.service;

import com.kaboom.dto.AuthDtos.LoginRequest;
import com.kaboom.dto.AuthDtos.RegisterRequest;
import com.kaboom.dto.StudentAuthDtos.StudentAuthResponse;
import com.kaboom.dto.StudentAuthDtos.StudentDto;
import com.kaboom.exception.ApiException;
import com.kaboom.model.AuthToken;
import com.kaboom.model.Student;
import com.kaboom.repository.AuthTokenRepository;
import com.kaboom.repository.StudentRepository;
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

/**
 * Student accounts. Same rules as teacher accounts, kept in their own table.
 *
 * Sessions reuse the auth_tokens table: its "teacher_id" column simply holds the account id.
 * Account ids are random UUIDs and each service looks the id up only in its own table, so a
 * teacher token never works as a student token (and the other way round).
 */
@Service
public class StudentAuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final StudentRepository students;
    private final AuthTokenRepository tokens;
    private final PasswordEncoder encoder;
    private final Duration tokenLife;
    private final Duration sessionLife;

    public StudentAuthService(StudentRepository students,
                              AuthTokenRepository tokens,
                              PasswordEncoder encoder,
                              @Value("${app.auth.token-days:30}") long tokenDays,
                              @Value("${app.auth.session-hours:12}") long sessionHours) {
        this.students = students;
        this.tokens = tokens;
        this.encoder = encoder;
        this.tokenLife = Duration.ofDays(tokenDays);
        this.sessionLife = Duration.ofHours(sessionHours);
    }

    public StudentAuthResponse register(RegisterRequest req) {
        String email = normalize(req.email());
        if (students.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "อีเมลนี้ถูกใช้สมัครแล้ว");
        }
        Student s = students.save(new Student(email, req.displayName().trim(), encoder.encode(req.password())));
        return new StudentAuthResponse(issueToken(s, tokenLife), toDto(s));
    }

    public StudentAuthResponse login(LoginRequest req) {
        Student s = students.findByEmail(normalize(req.email()))
                .filter(x -> encoder.matches(req.password(), x.getPasswordHash()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "อีเมลหรือรหัสผ่านไม่ถูกต้อง"));
        return new StudentAuthResponse(issueToken(s, Boolean.TRUE.equals(req.remember()) ? tokenLife : sessionLife), toDto(s));
    }

    public Optional<Student> authenticate(String token) {
        if (token == null || token.isBlank()) return Optional.empty();
        return tokens.findById(hash(token))
                .filter(t -> t.getExpiresAt().isAfter(Instant.now()))
                .flatMap(t -> students.findById(t.getTeacherId()));
    }

    public Student requireStudent(String token) {
        return authenticate(token)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "กรุณาเข้าสู่ระบบใหม่"));
    }

    public void logout(String token) {
        if (token == null || token.isBlank()) return;
        tokens.deleteById(hash(token));
    }

    public StudentDto changeName(Student s, String displayName) {
        s.changeDisplayName(displayName.trim());
        return toDto(students.save(s));
    }

    public StudentDto changeEmail(Student s, String rawEmail, String currentPassword) {
        checkPassword(s, currentPassword);
        String email = normalize(rawEmail);
        if (!email.equals(s.getEmail()) && students.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "อีเมลนี้ถูกใช้สมัครแล้ว");
        }
        s.changeEmail(email);
        return toDto(students.save(s));
    }

    /** Logs the account out on every other device; this browser gets a fresh login of the same kind. */
    public StudentAuthResponse changePassword(Student s, String currentToken, String currentPassword, String newPassword) {
        checkPassword(s, currentPassword);
        Duration life = tokens.findById(hash(currentToken))
                .map(t -> Duration.between(Instant.now(), t.getExpiresAt()))
                .filter(d -> !d.isNegative())
                .orElse(sessionLife);
        s.changePasswordHash(encoder.encode(newPassword));
        students.save(s);
        tokens.deleteByTeacherId(s.getId());
        return new StudentAuthResponse(issueToken(s, life), toDto(s));
    }

    private void checkPassword(Student s, String password) {
        if (!encoder.matches(password, s.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "รหัสผ่านปัจจุบันไม่ถูกต้อง");
        }
    }

    public StudentDto toDto(Student s) {
        return new StudentDto(s.getId(), s.getEmail(), s.getDisplayName());
    }

    private String issueToken(Student s, Duration life) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        tokens.save(new AuthToken(hash(token), s.getId(), Instant.now().plus(life)));
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
