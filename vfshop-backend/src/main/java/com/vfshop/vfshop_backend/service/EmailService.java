
package com.vfshop.vfshop_backend.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtp(String email, String otp) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(email);
        message.setSubject("VF SHOP - Password Reset OTP");

        message.setText("""
                Hello,

                Your VF SHOP password reset OTP is: %s

                This OTP is valid for 5 minutes.
                Do not share this OTP with anyone.

                Thank you,
                VF SHOP Team
                """.formatted(otp));

        mailSender.send(message);
    }
}
