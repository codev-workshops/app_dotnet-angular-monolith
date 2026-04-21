package com.ordermanager.inventory.controller;

import com.ordermanager.inventory.dto.InventoryItemDto;
import com.ordermanager.inventory.dto.RestockRequest;
import com.ordermanager.inventory.service.InventoryService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public ResponseEntity<List<InventoryItemDto>> getAllInventory(HttpServletRequest request) {
        String token = extractToken(request);
        return ResponseEntity.ok(inventoryService.getAllInventory(token));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<InventoryItemDto> getByProductId(@PathVariable Integer productId,
                                                           HttpServletRequest request) {
        String token = extractToken(request);
        Optional<InventoryItemDto> item = inventoryService.getByProductId(productId, token);
        return item.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/product/{productId}/restock")
    public ResponseEntity<InventoryItemDto> restock(@PathVariable Integer productId,
                                                    @RequestBody RestockRequest restockRequest,
                                                    HttpServletRequest request) {
        String token = extractToken(request);
        Optional<InventoryItemDto> item = inventoryService.restock(productId, restockRequest.getQuantity(), token);
        return item.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<InventoryItemDto>> getLowStock(HttpServletRequest request) {
        String token = extractToken(request);
        return ResponseEntity.ok(inventoryService.getLowStock(token));
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
