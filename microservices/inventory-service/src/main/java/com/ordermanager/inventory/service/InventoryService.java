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
            repository.save(new InventoryItem(1, 50, 10, "A-01"));
            repository.save(new InventoryItem(2, 100, 10, "A-02"));
            repository.save(new InventoryItem(3, 150, 10, "A-03"));
            repository.save(new InventoryItem(4, 200, 10, "A-04"));
            repository.save(new InventoryItem(5, 250, 10, "A-05"));
        }
    }

    public List<InventoryItemDto> getAllInventory(String jwtToken) {
        return repository.findAll().stream()
                .map(item -> enrichWithProduct(item, jwtToken))
                .collect(Collectors.toList());
    }

    public Optional<InventoryItemDto> getByProductId(Integer productId, String jwtToken) {
        return repository.findByProductId(productId)
                .map(item -> enrichWithProduct(item, jwtToken));
    }

    public Optional<InventoryItemDto> restock(Integer productId, Integer quantity, String jwtToken) {
        Optional<InventoryItem> optionalItem = repository.findByProductId(productId);
        if (optionalItem.isEmpty()) {
            return Optional.empty();
        }

        InventoryItem item = optionalItem.get();
        item.setQuantityOnHand(item.getQuantityOnHand() + quantity);
        item.setLastRestocked(LocalDateTime.now());
        InventoryItem saved = repository.save(item);
        return Optional.of(enrichWithProduct(saved, jwtToken));
    }

    public List<InventoryItemDto> getLowStock(String jwtToken) {
        List<InventoryItem> allItems = repository.findAll();
        return allItems.stream()
                .filter(item -> item.getQuantityOnHand() <= item.getReorderLevel())
                .map(item -> enrichWithProduct(item, jwtToken))
                .collect(Collectors.toList());
    }

    private InventoryItemDto enrichWithProduct(InventoryItem item, String jwtToken) {
        InventoryItemDto dto = new InventoryItemDto();
        dto.setId(item.getId());
        dto.setProductId(item.getProductId());
        dto.setQuantityOnHand(item.getQuantityOnHand());
        dto.setReorderLevel(item.getReorderLevel());
        dto.setWarehouseLocation(item.getWarehouseLocation());
        dto.setLastRestocked(item.getLastRestocked());

        Map<String, Object> product = productClient.getProduct(item.getProductId(), jwtToken);
        dto.setProduct(product);

        return dto;
    }
}
