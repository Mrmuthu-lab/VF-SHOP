
package com.vfshop.vfshop_backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vfshop.vfshop_backend.dto.CartRequest;
import com.vfshop.vfshop_backend.entity.Cart;
import com.vfshop.vfshop_backend.entity.CartItem;
import com.vfshop.vfshop_backend.entity.Product;
import com.vfshop.vfshop_backend.repository.CartItemRepository;
import com.vfshop.vfshop_backend.repository.CartRepository;
import com.vfshop.vfshop_backend.repository.ProductRepository;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    public CartService(CartRepository cartRepository,
                       CartItemRepository cartItemRepository,
                       ProductRepository productRepository) {

        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public Cart addToCart(CartRequest request) {

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Cart cart = cartRepository.findByUserId(request.getUserId())
                .orElseGet(() -> new Cart(request.getUserId()));

        CartItem item = cart.getItems().stream()
                .filter(i -> i.getProductId().equals(request.getProductId()))
                .findFirst()
                .orElse(null);

        if (item != null) {

            item.setQuantity(item.getQuantity() + request.getQuantity());

        } else {

            item = new CartItem();

            item.setProductId(product.getId());
            item.setQuantity(request.getQuantity());
            item.setCart(cart);

            cart.getItems().add(item);
        }

        item.setProductName(product.getName());
        item.setPrice(product.getPrice());
        item.setImage(product.getImage());

        return cartRepository.save(cart);
    }

    public Cart getCart(Long userId) {
        return cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found"));
    }

    @Transactional
    public CartItem updateQuantity(Long itemId, Integer quantity) {

        if (quantity == null || quantity < 1) {
            throw new RuntimeException("Invalid quantity");
        }

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        item.setQuantity(quantity);

        return cartItemRepository.save(item);
    }

    @Transactional
    public void removeItem(Long itemId) {

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        Cart cart = item.getCart();
        cart.getItems().remove(item);

        cartRepository.save(cart);
    }

    @Transactional
    public void clearCart(Long userId) {

        Cart cart = getCart(userId);
        cart.getItems().clear();

        cartRepository.save(cart);
    }
}
