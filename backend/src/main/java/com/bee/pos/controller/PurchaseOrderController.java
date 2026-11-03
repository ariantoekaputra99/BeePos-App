package com.bee.pos.controller;

import com.bee.pos.dto.PurchaseDtos.PurchaseOrderRequest;
import com.bee.pos.dto.PurchaseDtos.PurchaseOrderResponse;
import com.bee.pos.service.PurchaseOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchases")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
public class PurchaseOrderController {
    private final PurchaseOrderService purchases;

    @GetMapping
    public List<PurchaseOrderResponse> list() {
        return purchases.findAll();
    }

    @GetMapping("/{id}")
    public PurchaseOrderResponse get(@PathVariable Long id) {
        return purchases.get(id);
    }

    @PostMapping
    public ResponseEntity<PurchaseOrderResponse> create(@Valid @RequestBody PurchaseOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(purchases.create(request));
    }

    @PostMapping("/{id}/receive")
    public PurchaseOrderResponse receive(@PathVariable Long id) {
        return purchases.receive(id);
    }

    @PostMapping("/{id}/cancel")
    public PurchaseOrderResponse cancel(@PathVariable Long id) {
        return purchases.cancel(id);
    }
}
