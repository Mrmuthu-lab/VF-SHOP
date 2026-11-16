
package com.vfshop.vfshop_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.vfshop.vfshop_backend.entity.Role;
import com.vfshop.vfshop_backend.entity.User;
import com.vfshop.vfshop_backend.repository.UserRepository;

@Configuration
public class AdminInitializer {

    @Value("${app.admin.email:}")
    private String email;

    @Value("${app.admin.password:}")
    private String password;

    @Value("${app.admin.name:VF SHOP Admin}")
    private String name;

    @Bean
    public ApplicationRunner createAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {

            // Check admin credentials
            if (email == null || email.isBlank()
                    || password == null || password.isBlank()) {

                System.out.println(
                    "Admin creation skipped: credentials not configured."
                );
                return;
            }

            // Check existing admin
            if (userRepository.existsByEmail(email)) {
                System.out.println("Admin account already exists.");
                return;
            }

            // Create admin account
            User admin = new User();

            admin.setName(name);
            admin.setEmail(email);
            admin.setPassword(passwordEncoder.encode(password));
            admin.setRole(Role.ADMIN);

            userRepository.save(admin);

            System.out.println("VF SHOP Admin account created.");
        };
    }
}
