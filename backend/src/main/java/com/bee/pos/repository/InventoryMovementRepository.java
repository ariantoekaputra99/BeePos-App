package com.bee.pos.repository;

import com.bee.pos.entity.InventoryMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {
    List<InventoryMovement> findTop200ByOrderByCreatedAtDesc();

    List<InventoryMovement> findTop200ByProductIdOrderByCreatedAtDesc(Long productId);
}
