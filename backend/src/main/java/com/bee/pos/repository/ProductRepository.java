package com.bee.pos.repository;

import com.bee.pos.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findAllByOrderByNameAsc();

    @Query("select p from Product p where (p.active = true or p.active is null) and p.stock <= coalesce(p.minStock, 5) order by p.stock")
    List<Product> findLowStock();

    @Query("select count(p) from Product p where p.active = true or p.active is null")
    long countActive();

    Optional<Product> findBySkuIgnoreCase(String sku);

    Optional<Product> findByBarcode(String barcode);

    boolean existsBySkuIgnoreCaseAndIdNot(String sku, Long id);

    boolean existsBySkuIgnoreCase(String sku);

    long countByCategory(String category);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);
}
