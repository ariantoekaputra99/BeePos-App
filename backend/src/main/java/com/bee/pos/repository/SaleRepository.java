package com.bee.pos.repository;

import com.bee.pos.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public interface SaleRepository extends JpaRepository<Sale, Long> {
    List<Sale> findTop20ByOrderByCreatedAtDesc();

    List<Sale> findByCreatedAtBetweenOrderByCreatedAtDesc(OffsetDateTime from, OffsetDateTime to);

    @Query("select coalesce(sum(s.total), 0) from Sale s where s.status = com.bee.pos.entity.SaleStatus.COMPLETED or s.status is null")
    BigDecimal totalRevenue();

    @Query("select coalesce(sum(s.tax), 0) from Sale s where s.status = com.bee.pos.entity.SaleStatus.COMPLETED or s.status is null")
    BigDecimal totalTax();

    @Query("select count(s) from Sale s where s.status = com.bee.pos.entity.SaleStatus.COMPLETED or s.status is null")
    long countCompleted();

    @Query("""
        select coalesce(sum(i.quantity * coalesce(i.unitCost, 0)), 0)
        from SaleItem i where i.sale.status = com.bee.pos.entity.SaleStatus.COMPLETED or i.sale.status is null
        """)
    BigDecimal totalCost();

    @Query("""
        select s from Sale s
        where s.createdAt >= :from and s.createdAt < :to
        order by s.createdAt desc
        """)
    List<Sale> findInRange(@Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

    boolean existsByCustomerId(Long customerId);
}
