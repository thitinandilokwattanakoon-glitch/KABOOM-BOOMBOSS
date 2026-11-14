package com.kaboom.repository;

import com.kaboom.model.PlayerResult;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlayerResultRepository extends JpaRepository<PlayerResult, Long> {
    List<PlayerResult> findTop60ByStudentIdOrderByEndedAtDesc(String studentId);
    List<PlayerResult> findByGameIdOrderByPlaceAsc(String gameId);
    Optional<PlayerResult> findFirstByGameIdAndStudentId(String gameId, String studentId);
}
