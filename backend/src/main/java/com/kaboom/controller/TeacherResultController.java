package com.kaboom.controller;

import com.kaboom.dto.ResultDtos.TeacherGame;
import com.kaboom.dto.ResultDtos.TeacherReport;
import com.kaboom.service.CurrentTeacher;
import com.kaboom.service.ResultService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The teacher's results: the games they ran and the report of each one. */
@RestController
@RequestMapping("/api/teacher-results")
public class TeacherResultController {

    private final ResultService results;
    private final CurrentTeacher teacher;

    public TeacherResultController(ResultService results, CurrentTeacher teacher) {
        this.results = results;
        this.teacher = teacher;
    }

    @GetMapping
    public List<TeacherGame> list(@RequestHeader(value = "Authorization", required = false) String auth) {
        return results.gamesOf(teacher.from(auth).getId());
    }

    @GetMapping("/{gameId}")
    public TeacherReport report(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String gameId) {
        return results.report(teacher.from(auth).getId(), gameId);
    }
}
