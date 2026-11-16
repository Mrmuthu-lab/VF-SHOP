
package com.vfshop.vfshop_backend.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vfshop.vfshop_backend.entity.Product;
import com.vfshop.vfshop_backend.repository.ProductRepository;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    // GET ALL PRODUCTS
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productRepository.findAll());
    }

    // GET PRODUCT BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {

        Optional<Product> product = productRepository.findById(id);

        return product.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ADD PRODUCT
    @PostMapping
    public ResponseEntity<?> addProduct(@RequestBody Product product) {

        if (product.getName() == null || product.getName().isBlank()) {
            return ResponseEntity.badRequest().body("Product name is required");
        }

        if (product.getPrice() <= 0) {
            return ResponseEntity.badRequest().body("Enter a valid price");
        }

        product.setId(null);

        Product savedProduct = productRepository.save(product);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);
    }

    // ADD MULTIPLE PRODUCTS
    @PostMapping("/bulk")
    public ResponseEntity<List<Product>> addBulkProducts(
            @RequestBody List<Product> products) {

        List<Product> savedProducts = new ArrayList<>();

        for (Product product : products) {

            boolean exists = productRepository.existsByNameAndImage(
                    product.getName(),
                    product.getImage()
            );

            if (!exists) {
                product.setId(null);
                savedProducts.add(productRepository.save(product));
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(savedProducts);
    }

    // UPDATE PRODUCT
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(
            @PathVariable Long id,
            @RequestBody Product updatedProduct) {

        Optional<Product> optionalProduct = productRepository.findById(id);

        if (optionalProduct.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (updatedProduct.getName() == null ||
                updatedProduct.getName().isBlank()) {
            return ResponseEntity.badRequest().body("Product name is required");
        }

        if (updatedProduct.getPrice() <= 0) {
            return ResponseEntity.badRequest().body("Enter a valid price");
        }

        Product existingProduct = optionalProduct.get();

        existingProduct.setName(updatedProduct.getName());
        existingProduct.setPrice(updatedProduct.getPrice());
        existingProduct.setImage(updatedProduct.getImage());
        existingProduct.setDescription(updatedProduct.getDescription());

        Product savedProduct = productRepository.save(existingProduct);

        return ResponseEntity.ok(savedProduct);
    }

    // DELETE PRODUCT
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {

        if (!productRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        productRepository.deleteById(id);

        return ResponseEntity.ok("Product deleted successfully");
    }
}
