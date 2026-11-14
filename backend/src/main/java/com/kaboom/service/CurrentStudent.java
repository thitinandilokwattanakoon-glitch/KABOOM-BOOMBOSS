package com.kaboom.service;

import com.kaboom.model.Student;
import org.springframework.stereotype.Component;

/** Turns an "Authorization: Bearer <token>" header into the logged-in student (401 if missing/expired). */
@Component
public class CurrentStudent {

    private final StudentAuthService auth;

    public CurrentStudent(StudentAuthService auth) {
        this.auth = auth;
    }

    public Student from(String authorizationHeader) {
        String token = null;
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            token = authorizationHeader.substring(7).trim();
        }
        return auth.requireStudent(token);
    }
}
