package com.kaboom.service;

import com.kaboom.model.Teacher;
import org.springframework.stereotype.Component;

/** Turns an "Authorization: Bearer <token>" header into the logged-in teacher (401 if missing/expired). */
@Component
public class CurrentTeacher {

    private final AuthService auth;

    public CurrentTeacher(AuthService auth) {
        this.auth = auth;
    }

    public Teacher from(String authorizationHeader) {
        String token = null;
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            token = authorizationHeader.substring(7).trim();
        }
        return auth.requireTeacher(token);
    }
}
