package com.kaboom.repository;

import com.kaboom.model.Teacher;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeacherRepository extends JpaRepository<Teacher, String> {
    Optional<Teacher> findByEmail(String email);
    boolean existsByEmail(String email);
}
