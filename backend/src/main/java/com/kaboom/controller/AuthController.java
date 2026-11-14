package com.kaboom.controller;

import com.kaboom.dto.AuthDtos.AuthResponse;
import com.kaboom.dto.AuthDtos.LoginRequest;
import com.kaboom.dto.AuthDtos.RegisterRequest;
import com.kaboom.dto.AuthDtos.TeacherDto;
import com.kaboom.dto.AuthDtos.ForgotPasswordRequest;
import com.kaboom.dto.AuthDtos.ResetPasswordRequest;
import com.kaboom.service.AuthService;
import com.kaboom.service.PasswordResetService;
import com.kaboom.service.PasswordResetService.AccountType;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;
    private final PasswordResetService passwordReset;

    public AuthController(AuthService auth, PasswordResetService passwordReset) {
        this.auth = auth;
        this.passwordReset = passwordReset;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(auth.register(req));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return auth.login(req);
    }

    @GetMapping("/me")
    public TeacherDto me(@RequestHeader(value = "Authorization", required = false) String header) {
        return auth.toDto(auth.requireTeacher(bearer(header)));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(value = "Authorization", required = false) String header) {
        auth.logout(bearer(header));
        return ResponseEntity.noContent().build();
    }

    /** Always 204, whether or not the e-mail has an account. */
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        passwordReset.request(AccountType.TEACHER, req.email());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        passwordReset.reset(AccountType.TEACHER, req.token(), req.password());
        return ResponseEntity.noContent().build();
    }

    private static String bearer(String header) {
        if (header != null && header.startsWith("Bearer ")) return header.substring(7).trim();
        return null;
    }
}
