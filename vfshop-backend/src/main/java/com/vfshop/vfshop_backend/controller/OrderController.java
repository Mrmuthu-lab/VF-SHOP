
package com.vfshop.vfshop_backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vfshop.vfshop_backend.entity.Order;
import com.vfshop.vfshop_backend.service.OrderService;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // Place Order
    @PostMapping("/place")
    public ResponseEntity<Order> placeOrder(@RequestBody Order order) {
        Order savedOrder = orderService.placeOrder(order);
        return ResponseEntity.ok(savedOrder);
    }

    // Get User Orders
    @GetMapping("/{userId}")
    public ResponseEntity<List<Order>> getUserOrders(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                orderService.getUserOrders(userId)
        );
    }

    // Cancel Order
    @PutMapping("/cancel/{orderId}/{userId}")
    public ResponseEntity<Order> cancelOrder(
            @PathVariable Long orderId,
            @PathVariable Long userId) {

        Order cancelledOrder =
                orderService.cancelOrder(orderId, userId);

        return ResponseEntity.ok(cancelledOrder);
    }


@PutMapping("/update-status/{orderId}")
public ResponseEntity<Order> updateOrderStatus(
        @PathVariable Long orderId,
        @RequestParam String status) {

    Order updatedOrder = orderService.updateOrderStatus(orderId, status);
    return ResponseEntity.ok(updatedOrder);
}

@GetMapping("/all")
public ResponseEntity<List<Order>> getAllOrders() {
    return ResponseEntity.ok(orderService.getAllOrders());
}

}
