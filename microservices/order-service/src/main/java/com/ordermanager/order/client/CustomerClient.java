package com.ordermanager.order.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class CustomerClient {

    private static final Logger log = LoggerFactory.getLogger(CustomerClient.class);

    private final RestTemplate restTemplate;
    private final String customerServiceUrl;

    public CustomerClient(RestTemplate restTemplate,
                          @Value("${services.customer-url}") String customerServiceUrl) {
        this.restTemplate = restTemplate;
        this.customerServiceUrl = customerServiceUrl;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getCustomer(Integer customerId, String authToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", authToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    customerServiceUrl + "/api/customers/" + customerId,
                    HttpMethod.GET,
                    entity,
                    Map.class
            );
            return response.getBody();
        } catch (Exception e) {
            log.warn("Failed to fetch customer {}: {}", customerId, e.getMessage());
            return null;
        }
    }
}
