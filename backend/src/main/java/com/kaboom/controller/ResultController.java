package com.kaboom.controller;

import com.kaboom.dto.ResultDtos.GameCard;
import com.kaboom.dto.ResultDtos.GameDetail;
import com.kaboom.dto.ResultDtos.PracticeAnswer;
import com.kaboom.dto.ResultDtos.PracticeCheck;
import com.kaboom.dto.ResultDtos.PracticeQuestion;
import com.kaboom.service.CurrentStudent;
import com.kaboom.service.ResultService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The student dashboard: games played, the detail of one game, and practising its questions alone. */
@RestController
@RequestMapping("/api/results")
public class ResultController {

    private final ResultService results;
    private final CurrentStudent student;

    public ResultController(ResultService results, CurrentStudent student) {
        this.results = results;
        this.student = student;
    }

    @GetMapping
    public List<GameCard> list(@RequestHeader(value = "Authorization", required = false) String auth) {
        return results.listFor(student.from(auth).getId());
    }

    @GetMapping("/{gameId}")
    public GameDetail detail(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String gameId) {
        return results.detail(student.from(auth).getId(), gameId);
    }

    @GetMapping("/{gameId}/practice")
    public List<PracticeQuestion> practice(@RequestHeader(value = "Authorization", required = false) String auth,
                                           @PathVariable String gameId) {
        return results.practice(student.from(auth).getId(), gameId);
    }

    /** Checks one practice answer; the right answer is only told after the student has chosen. */
    @PostMapping("/{gameId}/practice/{index}")
    public PracticeCheck check(@RequestHeader(value = "Authorization", required = false) String auth,
                               @PathVariable String gameId, @PathVariable int index,
                               @Valid @RequestBody PracticeAnswer req) {
        return results.check(student.from(auth).getId(), gameId, index, req.choice());
    }
}
