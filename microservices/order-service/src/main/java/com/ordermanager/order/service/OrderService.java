package com.ordermanager.order.service;

import com.ordermanager.order.client.CustomerClient;
import com.ordermanager.order.client.ProductClient;
import com.ordermanager.order.dto.CreateOrderRequest;
import com.ordermanager.order.dto.OrderDto;
import com.ordermanager.order.dto.OrderItemDto;
import com.ordermanager.order.model.Order;
import com.ordermanager.order.model.OrderItem;
import com.ordermanager.order.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerClient customerClient;
    private final ProductClient productClient;

    public OrderService(OrderRepository orderRepository,
                        CustomerClient customerClient,
                        ProductClient productClient) {
        this.orderRepository = orderRepository;
        this.customerClient = customerClient;
        this.productClient = productClient;
    }

    public List<OrderDto> getAllOrders(String authToken) {
        List<Order> orders = orderRepository.findAllByOrderByOrderDateDesc();
        List<OrderDto> result = new ArrayList<>();
        for (Order order : orders) {
            result.add(toEnrichedDto(order, authToken));
        }
        return result;
    }

    public Optional<OrderDto> getOrderById(Long id, String authToken) {
        return orderRepository.findById(id)
                .map(order -> toEnrichedDto(order, authToken));
    }

    @Transactional
    public OrderDto createOrder(CreateOrderRequest request, String authToken) {
        Map<String, Object> customer = customerClient.getCustomer(request.getCustomerId(), authToken);
        if (customer == null) {
            throw new IllegalArgumentException("Customer not found: " + request.getCustomerId());
        }

        Order order = new Order();
        order.setCustomerId(request.getCustomerId());
        order.setOrderDate(LocalDateTime.now());
        order.setStatus("Pending");

        String address = buildShippingAddress(customer);
        order.setShippingAddress(address);

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CreateOrderRequest.OrderItemRequest itemRequest : request.getItems()) {
            Map<String, Object> product = productClient.getProduct(itemRequest.getProductId(), authToken);
            if (product == null) {
                throw new IllegalArgumentException("Product not found: " + itemRequest.getProductId());
            }

            OrderItem item = new OrderItem();
            item.setProductId(itemRequest.getProductId());
            item.setQuantity(itemRequest.getQuantity());

            BigDecimal price = extractPrice(product);
            item.setUnitPrice(price);

            totalAmount = totalAmount.add(price.multiply(BigDecimal.valueOf(itemRequest.getQuantity())));

            order.addItem(item);
        }

        order.setTotalAmount(totalAmount);

        Order saved = orderRepository.save(order);
        return toEnrichedDto(saved, authToken);
    }

    @Transactional
    public Optional<Order> updateOrderStatus(Long id, String status) {
        return orderRepository.findById(id)
                .map(order -> {
                    order.setStatus(status);
                    return orderRepository.save(order);
                });
    }

    private OrderDto toEnrichedDto(Order order, String authToken) {
        OrderDto dto = new OrderDto();
        dto.setId(order.getId());
        dto.setCustomerId(order.getCustomerId());
        dto.setOrderDate(order.getOrderDate());
        dto.setStatus(order.getStatus());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setShippingAddress(order.getShippingAddress());

        Map<String, Object> customer = customerClient.getCustomer(order.getCustomerId(), authToken);
        dto.setCustomer(customer);

        List<OrderItemDto> itemDtos = new ArrayList<>();
        for (OrderItem item : order.getItems()) {
            OrderItemDto itemDto = new OrderItemDto();
            itemDto.setId(item.getId());
            itemDto.setProductId(item.getProductId());
            itemDto.setQuantity(item.getQuantity());
            itemDto.setUnitPrice(item.getUnitPrice());
            itemDto.setLineTotal(item.getLineTotal());

            Map<String, Object> product = productClient.getProduct(item.getProductId(), authToken);
            itemDto.setProduct(product);

            itemDtos.add(itemDto);
        }
        dto.setItems(itemDtos);

        return dto;
    }

    private String buildShippingAddress(Map<String, Object> customer) {
        String address = getStringValue(customer, "address");
        String city = getStringValue(customer, "city");
        String state = getStringValue(customer, "state");
        String zipCode = getStringValue(customer, "zipCode");
        return address + ", " + city + ", " + state + " " + zipCode;
    }

    private String getStringValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? value.toString() : "";
    }

    private BigDecimal extractPrice(Map<String, Object> product) {
        Object price = product.get("price");
        if (price instanceof Number) {
            return BigDecimal.valueOf(((Number) price).doubleValue());
        }
        return new BigDecimal(price.toString());
    }
}
