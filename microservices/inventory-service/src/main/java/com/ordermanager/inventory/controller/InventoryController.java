package com.ordermanager.inventory.controller;

import com.ordermanager.inventory.dto.InventoryItemDto;
import com.ordermanager.inventory.service.InventoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP", "service", "inventory-service");
    }

    @GetMapping("/api/inventory")
    public List<InventoryItemDto> getAllInventory() {
        return inventoryService.getAllInventory();
    }

    @GetMapping("/api/inventory/product/{productId}")
    public ResponseEntity<InventoryItemDto> getByProductId(@PathVariable Integer productId) {
        return inventoryService.getByProductId(productId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/api/inventory/product/{productId}/restock")
    public ResponseEntity<InventoryItemDto> restock(@PathVariable Integer productId,
                                                     @RequestBody Map<String, Integer> body) {
        Integer quantity = body.get("quantity");
        if (quantity == null || quantity <= 0) {
            return ResponseEntity.badRequest().build();
        }
        return inventoryService.restock(productId, quantity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/api/inventory/low-stock")
    public List<InventoryItemDto> getLowStock() {
        return inventoryService.getLowStockItems();
    }
}
