package com.bee.pos.dto;

import com.bee.pos.entity.PurchaseOrder;
import com.bee.pos.entity.PurchaseOrderItem;
import com.bee.pos.entity.PurchaseOrderStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public final class PurchaseDtos {
    private PurchaseDtos() {}

    public record PurchaseOrderRequest(@NotNull Long supplierId,
                                       @Size(max = 255) String note,
                                       @NotEmpty List<@Valid Item> items) {
        public record Item(@NotNull Long productId, @NotNull @Min(1) Integer quantity,
                           @NotNull @PositiveOrZero BigDecimal unitPrice) {}
    }

    public record PurchaseOrderItemResponse(Long productId, String productName, String sku, int quantity,
                                            BigDecimal unitPrice, BigDecimal lineTotal) {
        static PurchaseOrderItemResponse from(PurchaseOrderItem item) {
            return new PurchaseOrderItemResponse(item.getProduct().getId(), item.getProduct().getName(),
                item.getProduct().getSku(), item.getQuantity(), item.getUnitPrice(), item.getLineTotal());
        }
    }

    public record PurchaseOrderResponse(Long id, String orderNumber, Long supplierId, String supplierName,
                                        PurchaseOrderStatus status, BigDecimal subtotal, BigDecimal total,
                                        String note, String createdBy, OffsetDateTime createdAt,
                                        OffsetDateTime receivedAt, List<PurchaseOrderItemResponse> items) {
        public static PurchaseOrderResponse from(PurchaseOrder order) {
            return new PurchaseOrderResponse(order.getId(), order.getOrderNumber(), order.getSupplier().getId(),
                order.getSupplier().getName(), order.getStatus(), order.getSubtotal(), order.getTotal(),
                order.getNote(), order.getCreatedBy(), order.getCreatedAt(), order.getReceivedAt(),
                order.getItems().stream().map(PurchaseOrderItemResponse::from).toList());
        }
    }
}
