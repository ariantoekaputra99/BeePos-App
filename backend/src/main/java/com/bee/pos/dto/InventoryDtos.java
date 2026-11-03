package com.bee.pos.dto;

import com.bee.pos.entity.InventoryMovement;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

public final class InventoryDtos {
    private InventoryDtos() {}

    /** For IN/OUT, quantity is units moved (>= 1). For ADJUST (stock opname), quantity is the counted stock (>= 0). */
    public record StockRequest(@NotNull Long productId, @NotNull @Min(0) Integer quantity, @Size(max = 255) String note) {}

    public record MovementResponse(Long id, Long productId, String productName, String sku, String type,
                                   int quantity, Integer stockAfter, String note, String createdBy,
                                   OffsetDateTime createdAt) {
        public static MovementResponse from(InventoryMovement m) {
            return new MovementResponse(m.getId(), m.getProduct().getId(), m.getProduct().getName(),
                m.getProduct().getSku(), m.getType(), m.getQuantity(), m.getStockAfter(), m.getNote(),
                m.getCreatedBy(), m.getCreatedAt());
        }
    }
}
