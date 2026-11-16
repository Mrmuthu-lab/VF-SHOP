
package com.vfshop.vfshop_backend.controller;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vfshop.vfshop_backend.dto.LoginRequest;
import com.vfshop.vfshop_backend.dto.RegisterRequest;
import com.vfshop.vfshop_backend.entity.User;
import com.vfshop.vfshop_backend.security.JwtService;
import com.vfshop.vfshop_backend.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;
    private final JwtService jwtService;

    public UserController(
            UserService userService,
            JwtService jwtService) {

        this.userService = userService;
        this.jwtService = jwtService;
    }

    // REGISTER
    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody RegisterRequest request) {

        User user = userService.register(request);

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("message", "Registration successful");
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhone());
        response.put("role", user.getRole().name());

        return ResponseEntity.ok(response);
    }

    // LOGIN WITH JWT
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request) {

        User user = userService.login(request);

        String token = jwtService.generateToken(user);

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("message", "Login successful");
        response.put("token", token);
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhone());
        response.put("role", user.getRole().name());

        return ResponseEntity.ok(response);
    }

    // CUSTOMER COUNT
    @GetMapping("/count")
    public ResponseEntity<?> getCustomerCount() {

        long count = userService.getCustomerCount();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("customerCount", count);

        return ResponseEntity.ok(response);
    }

    // GET ALL CUSTOMERS
    @GetMapping("/customers")
    public ResponseEntity<?> getAllCustomers() {

        List<User> users = userService.getAllCustomers();

        List<Map<String, Object>> customers = new ArrayList<>();

        for (User user : users) {

            Map<String, Object> customer = new LinkedHashMap<>();

            customer.put("id", user.getId());
            customer.put("name", user.getName());
            customer.put("email", user.getEmail());
            customer.put("phone", user.getPhone());
            customer.put("role", user.getRole().name());
            customer.put("createdAt", user.getCreatedAt());

            customers.add(customer);
        }

        return ResponseEntity.ok(customers);
    }
}
