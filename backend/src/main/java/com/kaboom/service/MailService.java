package com.kaboom.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Sends e-mail through the SMTP account set in the environment (SPRING_MAIL_HOST, SPRING_MAIL_USERNAME, ...).
 * Until that is set, Spring creates no mail sender, and the reset link is written to the backend console instead
 * so the feature can still be tried on a development machine.
 */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final ObjectProvider<JavaMailSender> sender;
    private final String from;

    public MailService(ObjectProvider<JavaMailSender> sender, @Value("${app.mail.from:}") String from) {
        this.sender = sender;
        this.from = from;
    }

    public void sendPasswordReset(String to, String name, String link, long minutes) {
        JavaMailSender s = sender.getIfAvailable();
        if (s == null) {
            // English on purpose: the Windows console shows Thai as question marks.
            log.warn("E-mail is not set up yet (SPRING_MAIL_HOST). Password reset link for {}: {}", to, link);
            return;
        }
        SimpleMailMessage m = new SimpleMailMessage();
        if (!from.isBlank()) m.setFrom(from);
        m.setTo(to);
        m.setSubject("Kaboom บูมบอส: ตั้งรหัสผ่านใหม่");
        m.setText("""
                สวัสดี %s

                มีคำขอตั้งรหัสผ่านใหม่สำหรับบัญชี Kaboom บูมบอส ของคุณ
                กดลิงก์นี้เพื่อตั้งรหัสผ่านใหม่ (ใช้ได้ %d นาที และใช้ได้ครั้งเดียว):

                %s

                ถ้าคุณไม่ได้ขอ ไม่ต้องทำอะไร รหัสผ่านเดิมยังใช้ได้ตามปกติ
                """.formatted(name, minutes, link));
        try {
            s.send(m);
        } catch (MailException e) {
            log.error("Could not send the password reset e-mail to {} ({}). Link: {}", to, e.getMessage(), link);
        }
    }
}
