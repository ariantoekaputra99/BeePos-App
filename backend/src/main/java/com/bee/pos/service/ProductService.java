package com.bee.pos.service;

import com.bee.pos.entity.Product;
import com.bee.pos.exception.BusinessException;
import com.bee.pos.exception.NotFoundException;
import com.bee.pos.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository products;
    private final InventoryService inventory;

    public List<Product> search(String q, String category, boolean includeInactive, boolean lowStockOnly) {
        String needle = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        return products.findAllByOrderByNameAsc().stream()
            .filter(p -> includeInactive || !Boolean.FALSE.equals(p.getActive()))
            .filter(p -> category == null || category.isBlank() || category.equalsIgnoreCase(p.getCategory()))
            .filter(p -> !lowStockOnly || p.isLowStock())
            .filter(p -> needle.isEmpty()
                || p.getName().toLowerCase(Locale.ROOT).contains(needle)
                || p.getSku().toLowerCase(Locale.ROOT).contains(needle)
                || (p.getBarcode() != null && p.getBarcode().toLowerCase(Locale.ROOT).contains(needle)))
            .toList();
    }

    public Product get(Long id) {
        return products.findById(id).orElseThrow(() -> NotFoundException.of("Produk", id));
    }

    /** Exact lookup by barcode or SKU, used by the barcode scanner in the POS screen. */
    public Product findByCode(String code) {
        String value = code.trim();
        return products.findByBarcode(value)
            .or(() -> products.findBySkuIgnoreCase(value))
            .filter(p -> !Boolean.FALSE.equals(p.getActive()))
            .orElseThrow(() -> NotFoundException.of("Produk dengan kode", value));
    }

    @Transactional
    public Product create(Product input) {
        String sku = input.getSku().trim();
        if (products.existsBySkuIgnoreCase(sku)) throw new BusinessException("SKU " + sku + " sudah dipakai");
        int initialStock = input.getStock() == null ? 0 : input.getStock();
        Product product = Product.builder()
            .name(input.getName().trim())
            .sku(sku)
            .barcode(blankToNull(input.getBarcode()))
            .price(input.getPrice())
            .costPrice(input.getCostPrice())
            .stock(0)
            .minStock(input.getMinStock() == null ? 5 : input.getMinStock())
            .unit(blankToNull(input.getUnit()))
            .category(blankToNull(input.getCategory()))
            .description(blankToNull(input.getDescription()))
            .active(true)
            .build();
        product = products.save(product);
        if (initialStock > 0) {
            inventory.record(product, "IN", initialStock, "Stok awal");
        }
        return product;
    }

    /** Stock is intentionally NOT editable here; use the inventory endpoints so every change is audited. */
    @Transactional
    public Product update(Long id, Product input) {
        Product existing = get(id);
        String sku = input.getSku().trim();
        if (products.existsBySkuIgnoreCaseAndIdNot(sku, id)) throw new BusinessException("SKU " + sku + " sudah dipakai");
        existing.setName(input.getName().trim());
        existing.setSku(sku);
        existing.setBarcode(blankToNull(input.getBarcode()));
        existing.setPrice(input.getPrice());
        existing.setCostPrice(input.getCostPrice());
        existing.setMinStock(input.getMinStock() == null ? existing.getMinStock() : input.getMinStock());
        existing.setUnit(blankToNull(input.getUnit()));
        existing.setCategory(blankToNull(input.getCategory()));
        existing.setDescription(blankToNull(input.getDescription()));
        if (input.getActive() != null) existing.setActive(input.getActive());
        return products.save(existing);
    }

    /** Soft delete: products referenced by sales history must stay in the database. */
    @Transactional
    public void delete(Long id) {
        Product product = get(id);
        product.setActive(false);
        products.save(product);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
