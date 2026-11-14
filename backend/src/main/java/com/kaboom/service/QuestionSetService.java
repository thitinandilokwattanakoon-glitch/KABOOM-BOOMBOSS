package com.kaboom.service;

import com.kaboom.dto.QuestionSetDtos.QuestionDto;
import com.kaboom.dto.QuestionSetDtos.QuestionSetDto;
import com.kaboom.dto.QuestionSetDtos.QuestionSetRequest;
import com.kaboom.dto.QuestionSetDtos.QuestionSetSummary;
import com.kaboom.exception.ApiException;
import com.kaboom.model.Question;
import com.kaboom.model.QuestionSet;
import com.kaboom.repository.QuestionSetRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** All methods are scoped by teacherId, so a teacher can never see or touch another teacher's sets. */
@Service
public class QuestionSetService {

    private final QuestionSetRepository sets;

    public QuestionSetService(QuestionSetRepository sets) {
        this.sets = sets;
    }

    @Transactional(readOnly = true)
    public List<QuestionSetSummary> list(String teacherId) {
        return sets.findByTeacherIdOrderByUpdatedAtDesc(teacherId).stream()
                .map(s -> new QuestionSetSummary(s.getId(), s.getName(), s.getQuestions().size(), s.getUpdatedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public QuestionSetDto get(String teacherId, String id) {
        return toDto(find(teacherId, id));
    }

    @Transactional
    public QuestionSetDto create(String teacherId, QuestionSetRequest req) {
        QuestionSet set = new QuestionSet(teacherId, req.name().trim());
        set.replaceQuestions(toEntities(req.questions()));
        return toDto(sets.save(set));
    }

    @Transactional
    public QuestionSetDto update(String teacherId, String id, QuestionSetRequest req) {
        QuestionSet set = find(teacherId, id);
        set.rename(req.name().trim());
        set.replaceQuestions(toEntities(req.questions()));
        set.touch();
        return toDto(sets.save(set));
    }

    @Transactional
    public void delete(String teacherId, String id) {
        sets.delete(find(teacherId, id));
    }

    private QuestionSet find(String teacherId, String id) {
        return sets.findByIdAndTeacherId(id, teacherId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ไม่พบชุดคำถามนี้"));
    }

    private static List<Question> toEntities(List<QuestionDto> dtos) {
        return dtos.stream()
                .map(q -> new Question(
                        q.text().trim(),
                        q.choices().stream().map(String::trim).toList(),
                        q.correctIndex(),
                        q.difficulty()))
                .toList();
    }

    private static QuestionSetDto toDto(QuestionSet s) {
        List<QuestionDto> qs = s.getQuestions().stream()
                .map(q -> new QuestionDto(q.getText(), q.getChoices(), q.getCorrectIndex(), q.getDifficulty()))
                .toList();
        return new QuestionSetDto(s.getId(), s.getName(), qs, s.getUpdatedAt());
    }
}
