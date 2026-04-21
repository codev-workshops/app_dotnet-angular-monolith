package com.ordermanager.order.controller;

import com.ordermanager.order.dto.CreateOrderRequest;
import com.ordermanager.order.dto.OrderDto;
import com.ordermanager.order.dto.UpdateStatusRequest;
import com.ordermanager.order.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "order-service"));
    }

    @GetMapping("/api/orders")
    public ResponseEntity<List<OrderDto>> getAllOrders(HttpServletRequest request) {
        String token = extractToken(request);
        return ResponseEntity.ok(orderService.getAllOrders(token));
    }

    @GetMapping("/api/orders/{id}")
    public ResponseEntity<OrderDto> getOrderById(@PathVariable Long id, HttpServletRequest request) {
        String token = extractToken(request);
        return orderService.getOrderById(id, token)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/api/orders")
    public ResponseEntity<OrderDto> createOrder(@RequestBody CreateOrderRequest createOrderRequest,
                                                HttpServletRequest request) {
        String token = extractToken(request);
        OrderDto created = orderService.createOrder(createOrderRequest, token);
        return ResponseEntity.ok(created);
    }

    @PatchMapping("/api/orders/{id}/status")
    public ResponseEntity<OrderDto> updateOrderStatus(@PathVariable Long id,
                                                      @RequestBody UpdateStatusRequest statusRequest,
                                                      HttpServletRequest request) {
        String token = extractToken(request);
        return orderService.updateOrderStatus(id, statusRequest.getStatus(), token)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
