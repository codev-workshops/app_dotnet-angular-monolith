package com.ordermanager.product.service;

import com.ordermanager.product.dto.ProductDto;
import com.ordermanager.product.model.Product;
import com.ordermanager.product.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<ProductDto> getAllProducts() {
        return productRepository.findAll().stream()
                .map(ProductDto::fromEntity)
                .collect(Collectors.toList());
    }

    public Optional<ProductDto> getProductById(Long id) {
        return productRepository.findById(id)
                .map(ProductDto::fromEntity);
    }

    public List<ProductDto> getProductsByCategory(String category) {
        return productRepository.findByCategory(category).stream()
                .map(ProductDto::fromEntity)
                .collect(Collectors.toList());
    }

    public ProductDto createProduct(Product product) {
        product.setCreatedAt(LocalDateTime.now());
        Product saved = productRepository.save(product);
        return ProductDto.fromEntity(saved);
    }

    public Optional<ProductDto> updateProduct(Long id, Product productDetails) {
        return productRepository.findById(id)
                .map(existing -> {
                    existing.setName(productDetails.getName());
                    existing.setDescription(productDetails.getDescription());
                    existing.setCategory(productDetails.getCategory());
                    existing.setPrice(productDetails.getPrice());
                    existing.setSku(productDetails.getSku());
                    Product updated = productRepository.save(existing);
                    return ProductDto.fromEntity(updated);
                });
    }

    public boolean deleteProduct(Long id) {
        if (productRepository.existsById(id)) {
            productRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Bean
    CommandLineRunner seedData() {
        return args -> {
            if (productRepository.count() == 0) {
                productRepository.save(new Product("Widget A", "Standard widget", "Widgets", new BigDecimal("9.99"), "WGT-001"));
                productRepository.save(new Product("Widget B", "Premium widget", "Widgets", new BigDecimal("19.99"), "WGT-002"));
                productRepository.save(new Product("Gadget X", "Basic gadget", "Gadgets", new BigDecimal("29.99"), "GDG-001"));
                productRepository.save(new Product("Gadget Y", "Advanced gadget", "Gadgets", new BigDecimal("49.99"), "GDG-002"));
                productRepository.save(new Product("Thingamajig", "Multi-purpose thingamajig", "Misc", new BigDecimal("14.99"), "THG-001"));
            }
        };
    }
}
