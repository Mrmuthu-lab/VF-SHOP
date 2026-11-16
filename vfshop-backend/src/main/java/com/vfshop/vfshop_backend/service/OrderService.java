
package com.vfshop.vfshop_backend.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.vfshop.vfshop_backend.entity.CartItem;
import com.vfshop.vfshop_backend.entity.Order;
import com.vfshop.vfshop_backend.entity.OrderItem;
import com.vfshop.vfshop_backend.repository.CartRepository;
import com.vfshop.vfshop_backend.repository.OrderRepository;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;

    public OrderService(
            OrderRepository orderRepository,
            CartRepository cartRepository) {

        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
    }

    // PLACE ORDER
    @Transactional
    public Order placeOrder(Order order) {

        var cart = cartRepository.findByUserId(order.getUserId())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Cart not found"));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cart is empty");
        }

        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem cartItem : cart.getItems()) {

            OrderItem item = new OrderItem();

            item.setProductId(cartItem.getProductId());
            item.setProductName(cartItem.getProductName());
            item.setImage(cartItem.getImage());
            item.setPrice(cartItem.getPrice());
            item.setQuantity(cartItem.getQuantity());

            item.setOrder(order);

            orderItems.add(item);
        }

        order.setItems(orderItems);

        // SUBTOTAL
        double subtotal = 0;

        for (OrderItem item : orderItems) {
            subtotal += item.getPrice() * item.getQuantity();
        }

        // COUPON DISCOUNT
        double discount = calculateCouponDiscount(order, subtotal);

        // DELIVERY CHARGE
        double delivery = subtotal >= 500 ? 0 : 40;

        // FINAL AMOUNT
        double finalAmount = subtotal - discount + delivery;

        order.setDiscountAmount(discount);
        order.setTotalAmount(finalAmount);

        if (order.getOrderDate() == null) {
            order.setOrderDate(java.time.LocalDateTime.now());
        }

        order.setOrderStatus("PLACED");

        Order savedOrder = orderRepository.save(order);

        // CLEAR CART
        cart.getItems().clear();
        cartRepository.save(cart);

        return savedOrder;
    }

    // COUPON CALCULATION
    private double calculateCouponDiscount(Order order, double subtotal) {

        String coupon = order.getCouponCode();

        if (coupon == null || coupon.trim().isEmpty()) {
            order.setCouponCode(null);
            return 0;
        }

        String code = coupon.trim().toUpperCase(Locale.ROOT);

        if (code.equals("FRESH10")) {

            order.setCouponCode(code);
            return Math.round(subtotal * 0.10 * 100.0) / 100.0;

        } else if (code.equals("VF20")) {

            order.setCouponCode(code);
            return Math.round(subtotal * 0.20 * 100.0) / 100.0;

        } else if (code.equals("SAVE50")) {

            order.setCouponCode(code);
            return Math.min(50, subtotal);
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Invalid coupon code");
    }

    // GET USER ORDERS
    public List<Order> getUserOrders(Long userId) {

        return orderRepository.findByUserIdOrderByOrderDateDesc(userId);
    }

    // CANCEL ORDER
    @Transactional
    public Order cancelOrder(Long orderId, Long userId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Order not found"));

        if (!order.getUserId().equals(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You cannot cancel this order");
        }

        if (!"PLACED".equalsIgnoreCase(order.getOrderStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "This order cannot be cancelled");
        }

        order.setOrderStatus("CANCELLED");

        return orderRepository.save(order);
    }

    // UPDATE ORDER STATUS
    @Transactional
    public Order updateOrderStatus(Long orderId, String status) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Order not found"));

        List<String> validStatuses = Arrays.asList(
                "PLACED",
                "CONFIRMED",
                "SHIPPED",
                "OUT_FOR_DELIVERY",
                "DELIVERED",
                "CANCELLED"
        );

        String newStatus = status.toUpperCase(Locale.ROOT);

        if (!validStatuses.contains(newStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid order status");
        }

        if ("CANCELLED".equalsIgnoreCase(order.getOrderStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cancelled order cannot be updated");
        }

        order.setOrderStatus(newStatus);

        return orderRepository.save(order);
    }

    // GET ALL ORDERS
    public List<Order> getAllOrders() {

        return orderRepository.findAll(
                Sort.by(Sort.Direction.DESC, "orderDate"));
    }
}
