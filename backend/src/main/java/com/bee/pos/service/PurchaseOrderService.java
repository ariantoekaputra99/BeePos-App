package com.bee.pos.service;

import com.bee.pos.dto.PurchaseDtos.PurchaseOrderRequest;
import com.bee.pos.dto.PurchaseDtos.PurchaseOrderResponse;
import com.bee.pos.entity.*;
import com.bee.pos.exception.BusinessException;
import com.bee.pos.exception.NotFoundException;
import com.bee.pos.repository.ProductRepository;
import com.bee.pos.repository.PurchaseOrderRepository;
import com.bee.pos.repository.SupplierRepository;
import com.bee.pos.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {
    private static final DateTimeFormatter NUMBER_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");

    private final PurchaseOrderRepository purchaseOrders;
    private final SupplierRepository suppliers;
    private final ProductRepository products;
    private final InventoryService inventory;
    private final ZoneId businessZone;

    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> findAll() {
        return purchaseOrders.findAllByOrderByCreatedAtDesc().stream().map(PurchaseOrderResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public PurchaseOrderResponse get(Long id) {
        return PurchaseOrderResponse.from(find(id));
    }

    @Transactional
    public PurchaseOrderResponse create(PurchaseOrderRequest request) {
        Supplier supplier = suppliers.findById(request.supplierId())
            .orElseThrow(() -> NotFoundException.of("Supplier", request.supplierId()));
        OffsetDateTime now = OffsetDateTime.now(businessZone);

        PurchaseOrder order = PurchaseOrder.builder()
            .supplier(supplier)
            .orderNumber("PO-" + now.format(NUMBER_FORMAT) + "-" + ThreadLocalRandom.current().nextInt(100, 1000))
            .createdAt(now)
            .createdBy(CurrentUser.username())
            .status(PurchaseOrderStatus.PENDING)
            .note(request.note() == null || request.note().isBlank() ? null : request.note().trim())
            .build();

        BigDecimal subtotal = BigDecimal.ZERO;
        for (PurchaseOrderRequest.Item line : request.items()) {
            Product product = products.findById(line.productId())
                .orElseThrow(() -> NotFoundException.of("Produk", line.productId()));
            BigDecimal lineTotal = line.unitPrice().multiply(BigDecimal.valueOf(line.quantity()));
            order.addItem(PurchaseOrderItem.builder()
                .product(product)
                .quantity(line.quantity())
                .unitPrice(line.unitPrice())
                .lineTotal(lineTotal)
                .build());
            subtotal = subtotal.add(lineTotal);
        }
        order.setSubtotal(subtotal);
        order.setTotal(subtotal);
        return PurchaseOrderResponse.from(purchaseOrders.save(order));
    }

    /** Receiving adds the goods to stock and updates each product's cost price to the latest purchase price. */
    @Transactional
    public PurchaseOrderResponse receive(Long id) {
        PurchaseOrder order = find(id);
        if (order.getStatus() != PurchaseOrderStatus.PENDING) {
            throw new BusinessException("Hanya PO berstatus PENDING yang bisa diterima");
        }
        for (PurchaseOrderItem item : order.getItems()) {
            Product product = inventory.lock(item.getProduct().getId());
            product.setCostPrice(item.getUnitPrice());
            inventory.record(product, "PURCHASE", item.getQuantity(), "Penerimaan " + order.getOrderNumber());
        }
        order.setStatus(PurchaseOrderStatus.RECEIVED);
        order.setReceivedAt(OffsetDateTime.now(businessZone));
        return PurchaseOrderResponse.from(purchaseOrders.save(order));
    }

    @Transactional
    public PurchaseOrderResponse cancel(Long id) {
        PurchaseOrder order = find(id);
        if (order.getStatus() != PurchaseOrderStatus.PENDING) {
            throw new BusinessException("Hanya PO berstatus PENDING yang bisa dibatalkan");
        }
        order.setStatus(PurchaseOrderStatus.CANCELLED);
        return PurchaseOrderResponse.from(purchaseOrders.save(order));
    }

    private PurchaseOrder find(Long id) {
        return purchaseOrders.findById(id).orElseThrow(() -> NotFoundException.of("Purchase order", id));
    }
}
