package com.bee.pos.repository;

import com.bee.pos.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findAllByOrderByNameAsc();

    Optional<Category> findByNameIgnoreCase(String name);
}
