package com.bee.pos.controller;

import com.bee.pos.entity.InventoryMovement;
import com.bee.pos.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryService inventoryService;

    @GetMapping
    public List<InventoryMovement> getAll() { return inventoryService.findAll(); }

    @PostMapping("/in")
    public void addStock(@RequestParam Long productId, @RequestParam Integer quantity, @RequestParam(defaultValue = "Stock in") String note) {
        inventoryService.addStock(productId, quantity, note);
    }

    @PostMapping("/out")
    public void reduceStock(@RequestParam Long productId, @RequestParam Integer quantity, @RequestParam(defaultValue = "Stock out") String note) {
        inventoryService.reduceStock(productId, quantity, note);
    }
}
