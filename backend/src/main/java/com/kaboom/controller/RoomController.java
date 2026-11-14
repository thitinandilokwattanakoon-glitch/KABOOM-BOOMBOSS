package com.kaboom.controller;

import com.kaboom.dto.RoomDtos.AnswerRequest;
import com.kaboom.dto.RoomDtos.CreateRoomRequest;
import com.kaboom.dto.RoomDtos.CreateRoomResponse;
import com.kaboom.dto.RoomDtos.RoomView;
import com.kaboom.model.Student;
import com.kaboom.service.CurrentStudent;
import com.kaboom.service.CurrentTeacher;
import com.kaboom.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Teacher actions need a teacher token, player actions need a student token.
 * Reading the room state needs no login (the same data is pushed over the WebSocket anyway).
 */
@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService rooms;
    private final CurrentTeacher teacher;
    private final CurrentStudent student;

    public RoomController(RoomService rooms, CurrentTeacher teacher, CurrentStudent student) {
        this.rooms = rooms;
        this.teacher = teacher;
        this.student = student;
    }

    @PostMapping
    public ResponseEntity<CreateRoomResponse> create(@RequestHeader(value = "Authorization", required = false) String auth,
                                                     @Valid @RequestBody CreateRoomRequest req) {
        String code = rooms.create(teacher.from(auth).getId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(new CreateRoomResponse(code));
    }

    @GetMapping("/{code}")
    public RoomView get(@PathVariable String code) {
        return rooms.view(code);
    }

    @PostMapping("/{code}/start")
    public RoomView start(@PathVariable String code, @RequestHeader(value = "Authorization", required = false) String auth) {
        rooms.start(code, teacher.from(auth).getId());
        return rooms.view(code);
    }

    @PostMapping("/{code}/reveal")
    public RoomView reveal(@PathVariable String code, @RequestHeader(value = "Authorization", required = false) String auth) {
        rooms.reveal(code, teacher.from(auth).getId());
        return rooms.view(code);
    }

    @PostMapping("/{code}/next")
    public RoomView next(@PathVariable String code, @RequestHeader(value = "Authorization", required = false) String auth) {
        rooms.next(code, teacher.from(auth).getId());
        return rooms.view(code);
    }

    @PostMapping("/{code}/end")
    public RoomView end(@PathVariable String code, @RequestHeader(value = "Authorization", required = false) String auth) {
        rooms.end(code, teacher.from(auth).getId());
        return rooms.view(code);
    }

    @PostMapping("/{code}/join")
    public RoomView join(@PathVariable String code, @RequestHeader(value = "Authorization", required = false) String auth) {
        // A picture is not needed to join: players without one get the default character.
        Student s = student.from(auth);
        rooms.join(code, s.getId(), s.getDisplayName());
        return rooms.view(code);
    }

    @PostMapping("/{code}/skill")
    public RoomView skill(@PathVariable String code, @RequestHeader(value = "Authorization", required = false) String auth) {
        rooms.useSkill(code, student.from(auth).getId());
        return rooms.view(code);
    }

    @PostMapping("/{code}/answer")
    public RoomView answer(@PathVariable String code,
                           @RequestHeader(value = "Authorization", required = false) String auth,
                           @Valid @RequestBody AnswerRequest req) {
        rooms.answer(code, student.from(auth).getId(), req.choice());
        return rooms.view(code);
    }
}
