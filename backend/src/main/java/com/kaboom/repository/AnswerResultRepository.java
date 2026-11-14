package com.kaboom.repository;

import com.kaboom.model.AnswerResult;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnswerResultRepository extends JpaRepository<AnswerResult, Long> {
    List<AnswerResult> findByGameId(String gameId);
}
