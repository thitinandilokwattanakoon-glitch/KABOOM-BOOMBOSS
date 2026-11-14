package com.kaboom.repository;

import com.kaboom.model.QuestionSet;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionSetRepository extends JpaRepository<QuestionSet, String> {
    List<QuestionSet> findByTeacherIdOrderByUpdatedAtDesc(String teacherId);
    Optional<QuestionSet> findByIdAndTeacherId(String id, String teacherId);
}
