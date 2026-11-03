package com.bee.pos.dto;

import com.bee.pos.entity.PaymentMethod;
import com.bee.pos.entity.Sale;
import com.bee.pos.entity.SaleItem;
import com.bee.pos.entity.SaleStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public final class SaleDtos {
    private SaleDtos() {}

    /** Tax is not accepted from the client: it is computed on the server from the store settings. */
    public record SaleRequest(@NotEmpty List<@Valid Item> items,
                              @NotNull PaymentMethod paymentMethod,
                              @PositiveOrZero BigDecimal discount,
                              @PositiveOrZero BigDecimal amountPaid,
                              Long customerId,
                              @Size(max = 255) String note) {
        public record Item(@NotNull Long productId, @Min(1) int quantity) {}
    }

    public record VoidRequest(@Size(max = 255) String reason) {}

    public record SaleItemResponse(Long productId, String productName, String sku, int quantity,
                                   BigDecimal unitPrice, BigDecimal lineTotal) {
        static SaleItemResponse from(SaleItem item) {
            String name = item.getProductName() != null ? item.getProductName() : item.getProduct().getName();
            return new SaleItemResponse(item.getProduct().getId(), name, item.getProduct().getSku(),
                item.getQuantity(), item.getUnitPrice(), item.getLineTotal());
        }
    }

    public record SaleResponse(Long id, String invoiceNumber, OffsetDateTime createdAt, SaleStatus status,
                               PaymentMethod paymentMethod, BigDecimal subtotal, BigDecimal tax,
                               String taxName, BigDecimal taxRate, Boolean taxInclusive,
                               BigDecimal discount, BigDecimal total, BigDecimal amountPaid,
                               BigDecimal changeAmount, String cashier, Long customerId, String customerName,
                               String note, OffsetDateTime voidedAt, String voidReason, int totalItems,
                               List<SaleItemResponse> items) {
        public static SaleResponse from(Sale sale) {
            List<SaleItemResponse> lines = sale.getItems().stream().map(SaleItemResponse::from).toList();
            int qty = lines.stream().mapToInt(SaleItemResponse::quantity).sum();
            return new SaleResponse(sale.getId(), sale.getInvoiceNumber(), sale.getCreatedAt(),
                sale.getStatus() == null ? SaleStatus.COMPLETED : sale.getStatus(),
                sale.getPaymentMethod(), sale.getSubtotal(), sale.getTax(),
                sale.getTaxName(), sale.getTaxRate(), sale.getTaxInclusive(),
                sale.getDiscount(), sale.getTotal(),
                sale.getAmountPaid(), sale.getChangeAmount(),
                sale.getCashier() == null ? null : sale.getCashier().getUsername(),
                sale.getCustomer() == null ? null : sale.getCustomer().getId(),
                sale.getCustomer() == null ? null : sale.getCustomer().getName(),
                sale.getNote(), sale.getVoidedAt(), sale.getVoidReason(), qty, lines);
        }
    }
}
