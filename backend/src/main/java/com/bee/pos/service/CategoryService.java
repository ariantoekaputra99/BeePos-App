package com.bee.pos.service;

import com.bee.pos.entity.Category;
import com.bee.pos.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<Category> findAll() {
        return categoryRepository.findAll();
    }

    public Category create(Category category) {
        return categoryRepository.save(category);
    }

    public Category update(Long id, Category updatedCategory) {
        Category existing = categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found: " + id));

        existing.setName(updatedCategory.getName());
        existing.setDescription(updatedCategory.getDescription());

        return categoryRepository.save(existing);
    }

    public void delete(Long id) {
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found: " + id));

        categoryRepository.delete(category);
    }
}
