package com.ordermanager.inventory.dto;

import java.time.LocalDateTime;
import java.util.Map;

public class InventoryItemDto {

    private Long id;
    private Integer productId;
    private Integer quantityOnHand;
    private Integer reorderLevel;
    private String warehouseLocation;
    private LocalDateTime lastRestocked;
    private Map<String, Object> product;

    public InventoryItemDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getProductId() {
        return productId;
    }

    public void setProductId(Integer productId) {
        this.productId = productId;
    }

    public Integer getQuantityOnHand() {
        return quantityOnHand;
    }

    public void setQuantityOnHand(Integer quantityOnHand) {
        this.quantityOnHand = quantityOnHand;
    }

    public Integer getReorderLevel() {
        return reorderLevel;
    }

    public void setReorderLevel(Integer reorderLevel) {
        this.reorderLevel = reorderLevel;
    }

    public String getWarehouseLocation() {
        return warehouseLocation;
    }

    public void setWarehouseLocation(String warehouseLocation) {
        this.warehouseLocation = warehouseLocation;
    }

    public LocalDateTime getLastRestocked() {
        return lastRestocked;
    }

    public void setLastRestocked(LocalDateTime lastRestocked) {
        this.lastRestocked = lastRestocked;
    }

    public Map<String, Object> getProduct() {
        return product;
    }

    public void setProduct(Map<String, Object> product) {
        this.product = product;
    }
}
