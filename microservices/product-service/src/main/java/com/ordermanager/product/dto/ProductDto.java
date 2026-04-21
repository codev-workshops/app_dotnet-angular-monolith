package com.ordermanager.product.dto;

import com.ordermanager.product.model.Product;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ProductDto {

    private Long id;
    private String name;
    private String description;
    private String category;
    private BigDecimal price;
    private String sku;
    private LocalDateTime createdAt;
    private Object inventory;

    public ProductDto() {
    }

    public static ProductDto fromEntity(Product product) {
        ProductDto dto = new ProductDto();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setCategory(product.getCategory());
        dto.setPrice(product.getPrice());
        dto.setSku(product.getSku());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setInventory(null);
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Object getInventory() {
        return inventory;
    }

    public void setInventory(Object inventory) {
        this.inventory = inventory;
    }
}
