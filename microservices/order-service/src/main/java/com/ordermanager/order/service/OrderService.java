package com.ordermanager.order.service;

import com.ordermanager.order.client.CustomerClient;
import com.ordermanager.order.client.InventoryClient;
import com.ordermanager.order.client.ProductClient;
import com.ordermanager.order.dto.CreateOrderRequest;
import com.ordermanager.order.dto.OrderDto;
import com.ordermanager.order.dto.OrderItemRequest;
import com.ordermanager.order.model.Order;
import com.ordermanager.order.model.OrderItem;
import com.ordermanager.order.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final CustomerClient customerClient;
    private final ProductClient productClient;
    private final InventoryClient inventoryClient;

    public OrderService(OrderRepository orderRepository,
                        CustomerClient customerClient,
                        ProductClient productClient,
                        InventoryClient inventoryClient) {
        this.orderRepository = orderRepository;
        this.customerClient = customerClient;
        this.productClient = productClient;
        this.inventoryClient = inventoryClient;
    }

    public List<OrderDto> getAllOrders(String jwtToken) {
        List<Order> orders = orderRepository.findAllByOrderByOrderDateDesc();
        return orders.stream()
                .map(order -> toDto(order, jwtToken, false))
                .collect(Collectors.toList());
    }

    public Optional<OrderDto> getOrderById(Long id, String jwtToken) {
        return orderRepository.findById(id)
                .map(order -> toDto(order, jwtToken, true));
    }

    @Transactional
    public OrderDto createOrder(CreateOrderRequest request, String jwtToken) {
        Map<String, Object> customer = customerClient.getCustomer(request.getCustomerId(), jwtToken);

        String shippingAddress = buildShippingAddress(customer);

        Order order = new Order();
        order.setCustomerId(request.getCustomerId());
        order.setOrderDate(LocalDateTime.now());
        order.setStatus("Pending");
        order.setShippingAddress(shippingAddress);

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> items = new ArrayList<>();

        for (OrderItemRequest itemRequest : request.getItems()) {
            Map<String, Object> product = productClient.getProduct(itemRequest.getProductId(), jwtToken);

            BigDecimal unitPrice = BigDecimal.ZERO;
            if (product != null && product.get("price") != null) {
                unitPrice = new BigDecimal(product.get("price").toString());
            }

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProductId(itemRequest.getProductId());
            item.setQuantity(itemRequest.getQuantity());
            item.setUnitPrice(unitPrice);

            items.add(item);
            totalAmount = totalAmount.add(unitPrice.multiply(BigDecimal.valueOf(itemRequest.getQuantity())));

            inventoryClient.deductStock(itemRequest.getProductId(), itemRequest.getQuantity(), jwtToken);
        }

        order.setTotalAmount(totalAmount);
        order.setItems(items);

        Order saved = orderRepository.save(order);
        return toDto(saved, jwtToken, true);
    }

    @Transactional
    public Optional<OrderDto> updateOrderStatus(Long id, String status, String jwtToken) {
        return orderRepository.findById(id)
                .map(order -> {
                    order.setStatus(status);
                    Order saved = orderRepository.save(order);
                    return toDto(saved, jwtToken, true);
                });
    }

    private OrderDto toDto(Order order, String jwtToken, boolean includeProductInfo) {
        OrderDto dto = new OrderDto();
        dto.setId(order.getId());
        dto.setCustomerId(order.getCustomerId());
        dto.setOrderDate(order.getOrderDate());
        dto.setStatus(order.getStatus());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setShippingAddress(order.getShippingAddress());

        Map<String, Object> customer = customerClient.getCustomer(order.getCustomerId(), jwtToken);
        dto.setCustomer(customer);

        List<OrderDto.OrderItemDto> itemDtos = order.getItems().stream()
                .map(item -> {
                    OrderDto.OrderItemDto itemDto = new OrderDto.OrderItemDto();
                    itemDto.setId(item.getId());
                    itemDto.setOrderId(order.getId());
                    itemDto.setProductId(item.getProductId());
                    itemDto.setQuantity(item.getQuantity());
                    itemDto.setUnitPrice(item.getUnitPrice());
                    itemDto.setLineTotal(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));

                    if (includeProductInfo) {
                        Map<String, Object> product = productClient.getProduct(item.getProductId(), jwtToken);
                        itemDto.setProduct(product);
                    }

                    return itemDto;
                })
                .collect(Collectors.toList());

        dto.setItems(itemDtos);
        return dto;
    }

    private String buildShippingAddress(Map<String, Object> customer) {
        if (customer == null) {
            return null;
        }
        StringBuilder sb = new StringBuilder();
        if (customer.get("address") != null) {
            sb.append(customer.get("address"));
        }
        if (customer.get("city") != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(customer.get("city"));
        }
        if (customer.get("state") != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(customer.get("state"));
        }
        if (customer.get("zipCode") != null) {
            if (sb.length() > 0) sb.append(" ");
            sb.append(customer.get("zipCode"));
        }
        return sb.length() > 0 ? sb.toString() : null;
    }
}
