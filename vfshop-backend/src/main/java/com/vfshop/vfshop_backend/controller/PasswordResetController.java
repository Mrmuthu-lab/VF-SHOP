
package com.vfshop.vfshop_backend.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vfshop.vfshop_backend.service.ForgotPasswordService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class PasswordResetController {

    private final ForgotPasswordService forgotPasswordService;

    public PasswordResetController(
            ForgotPasswordService forgotPasswordService) {
        this.forgotPasswordService = forgotPasswordService;
    }

    // SEND OTP
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @RequestBody Map<String, String> request) {

        String email = request.get("email");

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Email is required"));
        }

        String message = forgotPasswordService.sendOtp(email.trim());

        return ResponseEntity.ok(Map.of("message", message));
    }

    // VERIFY OTP
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(
            @RequestBody Map<String, String> request) {

        String email = request.get("email");
        String otp = request.get("otp");

        if (email == null || otp == null ||
                email.isBlank() || otp.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Email and OTP are required"));
        }

        String resetToken = forgotPasswordService.verifyOtp(
                email.trim(), otp.trim()
        );

        Map<String, String> response = new LinkedHashMap<>();
        response.put("message", "OTP verified successfully");
        response.put("resetToken", resetToken);

        return ResponseEntity.ok(response);
    }

    // RESET PASSWORD
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @RequestBody Map<String, String> request) {

        String email = request.get("email");
        String resetToken = request.get("resetToken");
        String newPassword = request.get("newPassword");

        if (email == null || resetToken == null ||
                newPassword == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "All fields are required"));
        }

        String message = forgotPasswordService.resetPassword(
                email.trim(),
                resetToken.trim(),
                newPassword
        );

        return ResponseEntity.ok(Map.of("message", message));
    }
}
