
package com.vfshop.vfshop_backend.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.vfshop.vfshop_backend.entity.User;
import com.vfshop.vfshop_backend.repository.UserRepository;

@Service
public class ForgotPasswordService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private final SecureRandom random = new SecureRandom();

    private final Map<String, OtpData> otpStorage =
            new ConcurrentHashMap<>();

    private final Map<String, ResetData> resetStorage =
            new ConcurrentHashMap<>();

    public ForgotPasswordService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    // SEND OTP
    public String sendOtp(String email) {

        User user = userRepository.findByEmail(email)
                .orElse(null);

        if (user == null) {
            return "If the account exists, an OTP will be sent.";
        }

        OtpData previous = otpStorage.get(email);

        if (previous != null &&
                previous.createdAt.plusSeconds(60).isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Please wait before requesting another OTP."
            );
        }

        String otp = String.format("%06d", random.nextInt(1000000));

        OtpData data = new OtpData();

        data.otpHash = hash(otp);
        data.createdAt = LocalDateTime.now();
        data.expiry = LocalDateTime.now().plusMinutes(5);
        data.attempts = 0;

        otpStorage.put(email, data);

        emailService.sendOtp(email, otp);

        return "OTP sent successfully to your email.";
    }

    // VERIFY OTP
    public String verifyOtp(String email, String otp) {

        OtpData data = otpStorage.get(email);

        if (data == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please request OTP first."
            );
        }

        if (LocalDateTime.now().isAfter(data.expiry)) {
            otpStorage.remove(email);

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "OTP expired. Please request a new OTP."
            );
        }

        if (data.attempts >= 5) {
            otpStorage.remove(email);

            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Too many incorrect attempts. Request a new OTP."
            );
        }

        data.attempts++;

        if (!data.otpHash.equals(hash(otp))) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid OTP."
            );
        }

        otpStorage.remove(email);

        String resetToken = generateToken();

        ResetData resetData = new ResetData();
        resetData.tokenHash = hash(resetToken);
        resetData.expiry = LocalDateTime.now().plusMinutes(5);

        resetStorage.put(email, resetData);

        return resetToken;
    }

    // RESET PASSWORD
    public String resetPassword(
            String email,
            String resetToken,
            String newPassword) {

        ResetData data = resetStorage.get(email);

        if (data == null ||
                LocalDateTime.now().isAfter(data.expiry)) {

            resetStorage.remove(email);

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Reset session expired. Verify OTP again."
            );
        }

        if (!data.tokenHash.equals(hash(resetToken))) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid reset token."
            );
        }

        if (newPassword == null || newPassword.length() < 8) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Password must contain at least 8 characters."
            );
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found."
                ));

        user.setPassword(passwordEncoder.encode(newPassword));

        userRepository.save(user);

        resetStorage.remove(email);

        return "Password reset successfully.";
    }

    private String hash(String value) {

        try {
            MessageDigest digest =
                    MessageDigest.getInstance("SHA-256");

            byte[] result = digest.digest(
                    value.getBytes(StandardCharsets.UTF_8)
            );

            return Base64.getEncoder().encodeToString(result);

        } catch (Exception e) {
            throw new IllegalStateException("Hashing failed", e);
        }
    }

    private String generateToken() {

        byte[] bytes = new byte[32];

        random.nextBytes(bytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    private static class OtpData {
        String otpHash;
        LocalDateTime createdAt;
        LocalDateTime expiry;
        int attempts;
    }

    private static class ResetData {
        String tokenHash;
        LocalDateTime expiry;
    }
}
