
package com.vfshop.vfshop_backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vfshop.vfshop_backend.entity.Order;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserIdOrderByOrderDateDesc(Long userId);

}
