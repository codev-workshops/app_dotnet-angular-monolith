package com.ordermanager.inventory.dto;

public class RestockRequest {

    private Integer quantity;

    public RestockRequest() {
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
