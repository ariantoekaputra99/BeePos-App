package com.bee.pos.service;

import com.bee.pos.dto.PurchaseOrderRequest;
import com.bee.pos.entity.*;
import com.bee.pos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {
    private final PurchaseOrderRepository purchaseOrders;
    private final SupplierRepository suppliers;
    private final ProductRepository products;
    private final InventoryService inventoryService;

    @Transactional
    public PurchaseOrder create(PurchaseOrderRequest request) {
        Supplier supplier = suppliers.findById(request.supplierId())
            .orElseThrow(() -> new IllegalArgumentException("Supplier not found: " + request.supplierId()));

        if (request.items() == null || request.items().isEmpty()) {
            throw new IllegalArgumentException("Purchase order must contain at least one item");
        }

        PurchaseOrder order = PurchaseOrder.builder()
            .supplier(supplier)
            .orderNumber("PO-" + System.currentTimeMillis())
            .createdAt(OffsetDateTime.now())
            .status(PurchaseOrderStatus.PENDING)
            .note(request.note())
            .subtotal(BigDecimal.ZERO)
            .total(BigDecimal.ZERO)
            .build();

        BigDecimal subtotal = BigDecimal.ZERO;

        for (PurchaseOrderRequest.Item itemRequest : request.items()) {
            Product product = products.findById(itemRequest.productId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + itemRequest.productId()));

            if (itemRequest.quantity() == null || itemRequest.quantity() <= 0) {
                throw new IllegalArgumentException("Quantity must be greater than zero for product " + product.getName());
            }

            BigDecimal unitPrice = BigDecimal.valueOf(itemRequest.unitPrice());
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(itemRequest.quantity()));

            PurchaseOrderItem item = PurchaseOrderItem.builder()
                .product(product)
                .quantity(itemRequest.quantity())
                .unitPrice(unitPrice)
                .lineTotal(lineTotal)
                .build();

            order.addItem(item);
            subtotal = subtotal.add(lineTotal);
        }

        order.setSubtotal(subtotal);
        order.setTotal(subtotal);
        return purchaseOrders.save(order);
    }

    @Transactional
    public PurchaseOrder receive(Long purchaseOrderId) {
        PurchaseOrder order = purchaseOrders.findById(purchaseOrderId)
            .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + purchaseOrderId));

        if (order.getStatus() == PurchaseOrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot receive cancelled purchase order");
        }

        for (PurchaseOrderItem item : order.getItems()) {
            inventoryService.addStock(item.getProduct().getId(), item.getQuantity(), "Purchase order " + order.getOrderNumber());
        }

        order.setStatus(PurchaseOrderStatus.RECEIVED);
        return purchaseOrders.save(order);
    }

    public List<PurchaseOrder> findAll() {
        return purchaseOrders.findAll();
    }
}
