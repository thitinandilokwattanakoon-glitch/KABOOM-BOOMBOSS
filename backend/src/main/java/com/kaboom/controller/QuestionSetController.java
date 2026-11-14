package com.kaboom.controller;

import com.kaboom.dto.QuestionSetDtos.QuestionSetDto;
import com.kaboom.dto.QuestionSetDtos.QuestionSetRequest;
import com.kaboom.dto.QuestionSetDtos.QuestionSetSummary;
import com.kaboom.service.CurrentTeacher;
import com.kaboom.service.QuestionSetService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/question-sets")
public class QuestionSetController {

    private final QuestionSetService service;
    private final CurrentTeacher current;

    public QuestionSetController(QuestionSetService service, CurrentTeacher current) {
        this.service = service;
        this.current = current;
    }

    @GetMapping
    public List<QuestionSetSummary> list(@RequestHeader(value = "Authorization", required = false) String auth) {
        return service.list(current.from(auth).getId());
    }

    @GetMapping("/{id}")
    public QuestionSetDto get(@RequestHeader(value = "Authorization", required = false) String auth,
                              @PathVariable String id) {
        return service.get(current.from(auth).getId(), id);
    }

    @PostMapping
    public ResponseEntity<QuestionSetDto> create(@RequestHeader(value = "Authorization", required = false) String auth,
                                                 @Valid @RequestBody QuestionSetRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(current.from(auth).getId(), req));
    }

    @PutMapping("/{id}")
    public QuestionSetDto update(@RequestHeader(value = "Authorization", required = false) String auth,
                                 @PathVariable String id,
                                 @Valid @RequestBody QuestionSetRequest req) {
        return service.update(current.from(auth).getId(), id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestHeader(value = "Authorization", required = false) String auth,
                                       @PathVariable String id) {
        service.delete(current.from(auth).getId(), id);
        return ResponseEntity.noContent().build();
    }
}
