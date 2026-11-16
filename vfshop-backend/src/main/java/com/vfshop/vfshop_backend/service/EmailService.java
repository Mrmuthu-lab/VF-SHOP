
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

        message.setText(
            "Hello,\n\n" +
            "Your VF SHOP password reset OTP is: " + otp +
            "\n\nThis OTP is valid for 5 minutes." +
            "\nDo not share this OTP with anyone." +
            "\n\nThank you,\nVF SHOP Team"
        );

        mailSender.send(message);
    }
}
