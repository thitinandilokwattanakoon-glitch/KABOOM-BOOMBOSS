package com.kaboom.dto;

public class StudentAuthDtos {

    public record StudentDto(String id, String email, String displayName) {}

    public record StudentAuthResponse(String token, StudentDto student) {}
}
