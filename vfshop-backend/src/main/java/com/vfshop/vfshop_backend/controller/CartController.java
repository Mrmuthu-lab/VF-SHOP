
package com.vfshop.vfshop_backend.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vfshop.vfshop_backend.dto.CartRequest;
import com.vfshop.vfshop_backend.entity.Cart;
import com.vfshop.vfshop_backend.entity.CartItem;
import com.vfshop.vfshop_backend.service.CartService;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "*")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    // Add Product
    @PostMapping("/add")
    public Cart addToCart(@RequestBody CartRequest request) {
        return cartService.addToCart(request);
    }

    // Get Cart
    @GetMapping("/{userId}")
    public Cart getCart(@PathVariable Long userId) {
        return cartService.getCart(userId);
    }

    // Update Quantity
    @PutMapping("/update/{itemId}")
    public CartItem updateQuantity(
            @PathVariable Long itemId,
            @RequestParam Integer quantity) {

        return cartService.updateQuantity(itemId, quantity);
    }

    // Remove Item
    @DeleteMapping("/remove/{itemId}")
    public String removeItem(@PathVariable Long itemId) {
        cartService.removeItem(itemId);
        return "Cart item removed successfully!";
    }

    // Clear Cart
    @DeleteMapping("/clear/{userId}")
    public String clearCart(@PathVariable Long userId) {
        cartService.clearCart(userId);
        return "Cart cleared successfully!";
    }
}
