package com.bee.pos.controller;

import com.bee.pos.dto.InventoryDtos.MovementResponse;
import com.bee.pos.dto.InventoryDtos.StockRequest;
import com.bee.pos.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
public class InventoryController {
    private final InventoryService inventory;

    @GetMapping
    public List<MovementResponse> list(@RequestParam(required = false) Long productId) {
        return inventory.findAll(productId);
    }

    @PostMapping("/in")
    public MovementResponse stockIn(@Valid @RequestBody StockRequest request) {
        return inventory.stockIn(request);
    }

    @PostMapping("/out")
    public MovementResponse stockOut(@Valid @RequestBody StockRequest request) {
        return inventory.stockOut(request);
    }

    @PostMapping("/adjust")
    public MovementResponse adjust(@Valid @RequestBody StockRequest request) {
        return inventory.adjust(request);
    }
}
