package com.bee.pos.service;

import com.bee.pos.entity.Category;
import com.bee.pos.exception.BusinessException;
import com.bee.pos.exception.NotFoundException;
import com.bee.pos.repository.CategoryRepository;
import com.bee.pos.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categories;
    private final ProductRepository products;

    public List<Category> findAll() {
        return categories.findAllByOrderByNameAsc();
    }

    @Transactional
    public Category create(Category input) {
        String name = input.getName().trim();
        categories.findByNameIgnoreCase(name).ifPresent(c -> {
            throw new BusinessException("Kategori " + name + " sudah ada");
        });
        return categories.save(Category.builder().name(name).description(input.getDescription()).build());
    }

    /** Renaming a category also renames it on every product that uses it. */
    @Transactional
    public Category update(Long id, Category input) {
        Category existing = find(id);
        String newName = input.getName().trim();
        categories.findByNameIgnoreCase(newName)
            .filter(c -> !c.getId().equals(id))
            .ifPresent(c -> { throw new BusinessException("Kategori " + newName + " sudah ada"); });
        String oldName = existing.getName();
        if (!oldName.equals(newName)) {
            products.findAll().stream()
                .filter(p -> oldName.equalsIgnoreCase(p.getCategory()))
                .forEach(p -> { p.setCategory(newName); products.save(p); });
        }
        existing.setName(newName);
        existing.setDescription(input.getDescription());
        return categories.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        Category category = find(id);
        long used = products.countByCategory(category.getName());
        if (used > 0) {
            throw new BusinessException("Kategori masih dipakai oleh " + used + " produk");
        }
        categories.delete(category);
    }

    private Category find(Long id) {
        return categories.findById(id).orElseThrow(() -> NotFoundException.of("Kategori", id));
    }
}
