package com.bee.pos.repository;

import com.bee.pos.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    List<PurchaseOrder> findAllByOrderByCreatedAtDesc();

    @Query("select coalesce(sum(p.total), 0) from PurchaseOrder p where p.status = com.bee.pos.entity.PurchaseOrderStatus.RECEIVED")
    BigDecimal totalReceivedValue();

    boolean existsBySupplierId(Long supplierId);
}
