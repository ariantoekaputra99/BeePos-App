package com.bee.pos.repository;

import com.bee.pos.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    List<Supplier> findAllByOrderByNameAsc();
}
