package com.kaboom.service;

import com.kaboom.exception.ApiException;
import com.kaboom.model.Avatar;
import com.kaboom.repository.AvatarRepository;
import java.util.Base64;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Permanent character pictures for teachers and students. The browser crops and shrinks the photo
 * before sending it, so what arrives is small; the checks here only make sure it really is a picture.
 */
@Service
public class AvatarService {

    private static final int MAX_BYTES = 300_000;
    private static final Pattern DATA_URL = Pattern.compile("^data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\\s]+)$");

    private final AvatarRepository avatars;
    private final AuthService teacherAuth;
    private final StudentAuthService studentAuth;

    public AvatarService(AvatarRepository avatars, AuthService teacherAuth, StudentAuthService studentAuth) {
        this.avatars = avatars;
        this.teacherAuth = teacherAuth;
        this.studentAuth = studentAuth;
    }

    /** The id of whoever owns this login token, teacher or student. */
    public String ownerId(String authorizationHeader) {
        String token = null;
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            token = authorizationHeader.substring(7).trim();
        }
        Optional<String> teacher = teacherAuth.authenticate(token).map(t -> t.getId());
        if (teacher.isPresent()) return teacher.get();
        return studentAuth.requireStudent(token).getId();
    }

    public void save(String ownerId, String dataUrl) {
        Matcher m = DATA_URL.matcher(dataUrl.trim());
        if (!m.matches()) throw new ApiException(HttpStatus.BAD_REQUEST, "ไฟล์รูปต้องเป็น JPEG, PNG หรือ WebP");
        byte[] bytes;
        try {
            bytes = Base64.getMimeDecoder().decode(m.group(2));
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "อ่านไฟล์รูปไม่ได้");
        }
        if (bytes.length > MAX_BYTES) throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "รูปใหญ่เกินไป");
        String type = m.group(1);
        if (!looksLike(type, bytes)) throw new ApiException(HttpStatus.BAD_REQUEST, "ไฟล์นี้ไม่ใช่รูปภาพ");

        Avatar a = avatars.findById(ownerId).orElse(null);
        if (a == null) avatars.save(new Avatar(ownerId, type, bytes));
        else {
            a.replace(type, bytes);
            avatars.save(a);
        }
    }

    public boolean exists(String ownerId) {
        return avatars.existsById(ownerId);
    }

    public Avatar find(String ownerId) {
        return avatars.findById(ownerId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ยังไม่มีรูป"));
    }

    /** Checks the first bytes against the declared type, so a renamed text file is refused. */
    private static boolean looksLike(String type, byte[] b) {
        if (b.length < 12) return false;
        return switch (type) {
            case "image/jpeg" -> (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8;
            case "image/png" -> (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G';
            case "image/webp" -> b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' && b[8] == 'W' && b[9] == 'E';
            default -> false;
        };
    }
}
