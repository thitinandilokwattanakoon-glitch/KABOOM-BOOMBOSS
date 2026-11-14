package com.kaboom.repository;

import com.kaboom.model.GameResult;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameResultRepository extends JpaRepository<GameResult, String> {
    List<GameResult> findTop60ByTeacherIdOrderByEndedAtDesc(String teacherId);
}
