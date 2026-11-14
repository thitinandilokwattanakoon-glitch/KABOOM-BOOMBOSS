package com.kaboom.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public record RegisterRequest(
            @NotBlank(message = "กรอกอีเมล")
            @Email(message = "รูปแบบอีเมลไม่ถูกต้อง")
            @Size(max = 200, message = "อีเมลยาวเกินไป")
            String email,

            @NotBlank(message = "กรอกรหัสผ่าน")
            @Size(min = 8, max = 72, message = "รหัสผ่านต้องยาว 8-72 ตัวอักษร")
            String password,

            @NotBlank(message = "กรอกชื่อที่ใช้แสดง")
            @Size(max = 50, message = "ชื่อที่ใช้แสดงยาวไม่เกิน 50 ตัวอักษร")
            String displayName) {}

    /** remember = true keeps the login for app.auth.token-days; otherwise it lasts app.auth.session-hours. */
    public record LoginRequest(
            @NotBlank(message = "กรอกอีเมล") String email,
            @NotBlank(message = "กรอกรหัสผ่าน") String password,
            Boolean remember) {}

    public record ForgotPasswordRequest(
            @NotBlank(message = "กรอกอีเมล")
            @Email(message = "รูปแบบอีเมลไม่ถูกต้อง")
            String email) {}

    public record ResetPasswordRequest(
            @NotBlank(message = "ลิงก์ตั้งรหัสผ่านไม่ถูกต้อง") String token,

            @NotBlank(message = "กรอกรหัสผ่านใหม่")
            @Size(min = 8, max = 72, message = "รหัสผ่านต้องยาว 8-72 ตัวอักษร")
            String password) {}

    public record ChangeNameRequest(
            @NotBlank(message = "กรอกชื่อที่ใช้แสดง")
            @Size(max = 50, message = "ชื่อที่ใช้แสดงยาวไม่เกิน 50 ตัวอักษร")
            String displayName) {}

    public record ChangeEmailRequest(
            @NotBlank(message = "กรอกอีเมลใหม่")
            @Email(message = "รูปแบบอีเมลไม่ถูกต้อง")
            @Size(max = 200, message = "อีเมลยาวเกินไป")
            String email,

            @NotBlank(message = "กรอกรหัสผ่านปัจจุบัน") String currentPassword) {}

    public record ChangePasswordRequest(
            @NotBlank(message = "กรอกรหัสผ่านปัจจุบัน") String currentPassword,

            @NotBlank(message = "กรอกรหัสผ่านใหม่")
            @Size(min = 8, max = 72, message = "รหัสผ่านต้องยาว 8-72 ตัวอักษร")
            String newPassword) {}

    public record TeacherDto(String id, String email, String displayName) {}

    public record AuthResponse(String token, TeacherDto teacher) {}
}
