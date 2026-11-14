package com.kaboom.controller;

import com.kaboom.dto.AuthDtos.ChangeEmailRequest;
import com.kaboom.dto.AuthDtos.ChangeNameRequest;
import com.kaboom.dto.AuthDtos.ChangePasswordRequest;
import com.kaboom.dto.AuthDtos.LoginRequest;
import com.kaboom.dto.AuthDtos.RegisterRequest;
import com.kaboom.dto.StudentAuthDtos.StudentAuthResponse;
import com.kaboom.dto.StudentAuthDtos.StudentDto;
import com.kaboom.dto.AuthDtos.ForgotPasswordRequest;
import com.kaboom.dto.AuthDtos.ResetPasswordRequest;
import com.kaboom.service.StudentAuthService;
import com.kaboom.service.PasswordResetService;
import com.kaboom.service.PasswordResetService.AccountType;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student-auth")
public class StudentAuthController {

    private final StudentAuthService auth;
    private final PasswordResetService passwordReset;

    public StudentAuthController(StudentAuthService auth, PasswordResetService passwordReset) {
        this.auth = auth;
        this.passwordReset = passwordReset;
    }

    @PostMapping("/register")
    public ResponseEntity<StudentAuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(auth.register(req));
    }

    @PostMapping("/login")
    public StudentAuthResponse login(@Valid @RequestBody LoginRequest req) {
        return auth.login(req);
    }

    @GetMapping("/me")
    public StudentDto me(@RequestHeader(value = "Authorization", required = false) String header) {
        return auth.toDto(auth.requireStudent(bearer(header)));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(value = "Authorization", required = false) String header) {
        auth.logout(bearer(header));
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/me/name")
    public StudentDto changeName(@RequestHeader(value = "Authorization", required = false) String header,
                                 @Valid @RequestBody ChangeNameRequest req) {
        return auth.changeName(auth.requireStudent(bearer(header)), req.displayName());
    }

    @PutMapping("/me/email")
    public StudentDto changeEmail(@RequestHeader(value = "Authorization", required = false) String header,
                                  @Valid @RequestBody ChangeEmailRequest req) {
        return auth.changeEmail(auth.requireStudent(bearer(header)), req.email(), req.currentPassword());
    }

    @PutMapping("/me/password")
    public StudentAuthResponse changePassword(@RequestHeader(value = "Authorization", required = false) String header,
                                              @Valid @RequestBody ChangePasswordRequest req) {
        String token = bearer(header);
        return auth.changePassword(auth.requireStudent(token), token, req.currentPassword(), req.newPassword());
    }

    /** Always 204, whether or not the e-mail has an account. */
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        passwordReset.request(AccountType.STUDENT, req.email());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        passwordReset.reset(AccountType.STUDENT, req.token(), req.password());
        return ResponseEntity.noContent().build();
    }

    private static String bearer(String header) {
        if (header != null && header.startsWith("Bearer ")) return header.substring(7).trim();
        return null;
    }
}
