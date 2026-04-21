package com.ordermanager.order.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class InventoryClient {

    private static final Logger log = LoggerFactory.getLogger(InventoryClient.class);

    private final RestTemplate restTemplate;
    private final String inventoryServiceUrl;

    public InventoryClient(RestTemplate restTemplate,
                           @Value("${services.inventory-url}") String inventoryServiceUrl) {
        this.restTemplate = restTemplate;
        this.inventoryServiceUrl = inventoryServiceUrl;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getInventory(Integer productId, String jwtToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(jwtToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    inventoryServiceUrl + "/api/inventory/product/" + productId,
                    HttpMethod.GET,
                    entity,
                    Map.class);
            return response.getBody();
        } catch (Exception e) {
            log.warn("Failed to fetch inventory for product {}: {}", productId, e.getMessage());
            return null;
        }
    }

    public boolean deductStock(Integer productId, Integer quantity, String jwtToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(jwtToken);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = Map.of("quantity", -quantity);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            restTemplate.exchange(
                    inventoryServiceUrl + "/api/inventory/product/" + productId + "/restock",
                    HttpMethod.POST,
                    entity,
                    Map.class);
            return true;
        } catch (Exception e) {
            log.warn("Failed to deduct inventory for product {}: {}", productId, e.getMessage());
            return false;
        }
    }
}
