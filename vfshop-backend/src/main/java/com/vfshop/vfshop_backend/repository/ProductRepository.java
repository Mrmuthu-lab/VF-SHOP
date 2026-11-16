package com.vfshop.vfshop_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vfshop.vfshop_backend.entity.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {

    boolean existsByNameAndImage(String name, String image);

}