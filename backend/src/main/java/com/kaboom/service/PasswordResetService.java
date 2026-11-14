package com.kaboom.service;

import com.kaboom.exception.ApiException;
import com.kaboom.model.PasswordResetToken;
import com.kaboom.model.Student;
import com.kaboom.model.Teacher;
import com.kaboom.repository.AuthTokenRepository;
import com.kaboom.repository.PasswordResetTokenRepository;
import com.kaboom.repository.StudentRepository;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * "Forgot password": e-mails a one-time link that is valid for a short time, then lets the owner set a new password.
 * Teachers and students use the same flow; the account type is part of the link so the right table is used.
 */
@Service
public class PasswordResetService {

    public enum AccountType { TEACHER, STUDENT }

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Duration LINK_LIFE = Duration.ofMinutes(30);

    private final TeacherRepository teachers;
    private final StudentRepository students;
    private final PasswordResetTokenRepository resets;
    private final AuthTokenRepository sessions;
    private final PasswordEncoder encoder;
    private final MailService mail;
    private final String frontendUrl;

    public PasswordResetService(TeacherRepository teachers,
                                StudentRepository students,
                                PasswordResetTokenRepository resets,
                                AuthTokenRepository sessions,
                                PasswordEncoder encoder,
                                MailService mail,
                                @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.teachers = teachers;
        this.students = students;
        this.resets = resets;
        this.sessions = sessions;
        this.encoder = encoder;
        this.mail = mail;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    /**
     * Sends a link if the e-mail belongs to an account. Says nothing either way, so nobody can use this
     * form to find out which e-mails are registered.
     */
    @Transactional
    public void request(AccountType type, String rawEmail) {
        String email = rawEmail.trim().toLowerCase(Locale.ROOT);
        String accountId;
        String name;
        if (type == AccountType.TEACHER) {
            Teacher t = teachers.findByEmail(email).orElse(null);
            if (t == null) return;
            accountId = t.getId();
            name = t.getDisplayName();
        } else {
            Student s = students.findByEmail(email).orElse(null);
            if (s == null) return;
            accountId = s.getId();
            name = s.getDisplayName();
        }

        resets.deleteByAccountId(accountId);
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String secret = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        resets.save(new PasswordResetToken(hash(secret), accountId, type.name(), Instant.now().plus(LINK_LIFE)));

        String role = type == AccountType.TEACHER ? "teacher" : "student";
        String link = frontendUrl + "/?reset=" + secret + "&role=" + role;
        mail.sendPasswordReset(email, name, link, LINK_LIFE.toMinutes());
    }

    /** Sets the new password, uses up the link and logs the account out on every device. */
    @Transactional
    public void reset(AccountType type, String secret, String newPassword) {
        PasswordResetToken r = resets.findById(hash(secret.trim()))
                .filter(x -> x.getAccountType().equals(type.name()))
                .filter(x -> x.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "ลิงก์นี้หมดอายุหรือถูกใช้ไปแล้ว กรุณาขอลิงก์ใหม่อีกครั้ง"));

        String newHash = encoder.encode(newPassword);
        if (type == AccountType.TEACHER) {
            Teacher t = teachers.findById(r.getAccountId()).orElseThrow(this::gone);
            t.changePasswordHash(newHash);
            teachers.save(t);
        } else {
            Student s = students.findById(r.getAccountId()).orElseThrow(this::gone);
            s.changePasswordHash(newHash);
            students.save(s);
        }
        resets.deleteByAccountId(r.getAccountId());
        sessions.deleteByTeacherId(r.getAccountId());
    }

    private ApiException gone() {
        return new ApiException(HttpStatus.BAD_REQUEST, "ไม่พบบัญชีนี้แล้ว");
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
