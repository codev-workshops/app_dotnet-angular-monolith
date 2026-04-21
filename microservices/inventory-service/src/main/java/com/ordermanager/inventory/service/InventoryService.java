package com.ordermanager.inventory.service;

import com.ordermanager.inventory.client.ProductClient;
import com.ordermanager.inventory.dto.InventoryItemDto;
import com.ordermanager.inventory.model.InventoryItem;
import com.ordermanager.inventory.repository.InventoryItemRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class InventoryService {

    private final InventoryItemRepository repository;
    private final ProductClient productClient;

    public InventoryService(InventoryItemRepository repository, ProductClient productClient) {
        this.repository = repository;
        this.productClient = productClient;
    }

    @PostConstruct
    public void seedData() {
        if (repository.count() == 0) {
            createSeedItem(1, 50, 10, "A-01");
            createSeedItem(2, 100, 10, "A-02");
            createSeedItem(3, 150, 10, "A-03");
            createSeedItem(4, 200, 10, "A-04");
            createSeedItem(5, 250, 10, "A-05");
        }
    }

    private void createSeedItem(int productId, int quantity, int reorderLevel, String location) {
        InventoryItem item = new InventoryItem();
        item.setProductId(productId);
        item.setQuantityOnHand(quantity);
        item.setReorderLevel(reorderLevel);
        item.setWarehouseLocation(location);
        item.setLastRestocked(LocalDateTime.of(2024, 1, 1, 0, 0, 0));
        repository.save(item);
    }

    public List<InventoryItemDto> getAllInventory() {
        return repository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public Optional<InventoryItemDto> getByProductId(Integer productId) {
        return repository.findByProductId(productId).map(this::toDto);
    }

    public Optional<InventoryItemDto> restock(Integer productId, Integer quantity) {
        return repository.findByProductId(productId).map(item -> {
            item.setQuantityOnHand(item.getQuantityOnHand() + quantity);
            item.setLastRestocked(LocalDateTime.now());
            InventoryItem saved = repository.save(item);
            return toDto(saved);
        });
    }

    public List<InventoryItemDto> getLowStockItems() {
        return repository.findLowStockItems().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private InventoryItemDto toDto(InventoryItem item) {
        InventoryItemDto dto = new InventoryItemDto();
        dto.setId(item.getId());
        dto.setProductId(item.getProductId());
        dto.setQuantityOnHand(item.getQuantityOnHand());
        dto.setReorderLevel(item.getReorderLevel());
        dto.setWarehouseLocation(item.getWarehouseLocation());
        dto.setLastRestocked(item.getLastRestocked());

        Map<String, Object> product = productClient.getProduct(item.getProductId());
        dto.setProduct(product);

        return dto;
    }
}
