package com.bee.pos.repository;

import com.bee.pos.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.OffsetDateTime;
import java.util.*;

public interface SaleRepository extends JpaRepository<Sale, Long> {
    List<Sale> findTop20ByOrderByCreatedAtDesc();
    List<Sale> findByCreatedAtBetweenOrderByCreatedAtDesc(OffsetDateTime from, OffsetDateTime to);
}
