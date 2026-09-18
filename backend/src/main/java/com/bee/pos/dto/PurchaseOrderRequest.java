package com.bee.pos.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record PurchaseOrderRequest(
    @NotNull Long supplierId,
    String note,
    @NotNull List<Item> items
) {
    public record Item(@NotNull Long productId, @NotNull Integer quantity, @NotNull Double unitPrice) {}
}
