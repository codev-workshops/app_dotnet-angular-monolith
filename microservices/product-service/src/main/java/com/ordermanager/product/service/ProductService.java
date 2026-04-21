package com.ordermanager.product.service;

import com.ordermanager.product.dto.ProductDto;
import com.ordermanager.product.model.Product;
import com.ordermanager.product.repository.ProductRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @PostConstruct
    public void seedData() {
        if (productRepository.count() == 0) {
            productRepository.save(new Product("Widget A", "Standard widget", "Widgets", new BigDecimal("9.99"), "WGT-001"));
            productRepository.save(new Product("Widget B", "Premium widget", "Widgets", new BigDecimal("19.99"), "WGT-002"));
            productRepository.save(new Product("Gadget X", "Basic gadget", "Gadgets", new BigDecimal("29.99"), "GDG-001"));
            productRepository.save(new Product("Gadget Y", "Advanced gadget", "Gadgets", new BigDecimal("49.99"), "GDG-002"));
            productRepository.save(new Product("Thingamajig", "Multi-purpose thingamajig", "Misc", new BigDecimal("14.99"), "THG-001"));
        }
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategory(category);
    }

    public Product createProduct(ProductDto dto) {
        Product product = new Product();
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setCategory(dto.getCategory());
        product.setPrice(dto.getPrice());
        product.setSku(dto.getSku());
        return productRepository.save(product);
    }
}
