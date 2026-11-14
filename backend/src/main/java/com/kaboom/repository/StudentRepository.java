package com.kaboom.repository;

import com.kaboom.model.Student;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRepository extends JpaRepository<Student, String> {
    Optional<Student> findByEmail(String email);
    boolean existsByEmail(String email);
}
