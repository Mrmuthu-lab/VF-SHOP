
package com.vfshop.vfshop_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vfshop.vfshop_backend.entity.CartItem;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

}
