package com.bee.pos.service;

import com.bee.pos.dto.InventoryDtos.MovementResponse;
import com.bee.pos.dto.InventoryDtos.StockRequest;
import com.bee.pos.entity.InventoryMovement;
import com.bee.pos.entity.Product;
import com.bee.pos.exception.BusinessException;
import com.bee.pos.exception.NotFoundException;
import com.bee.pos.repository.InventoryMovementRepository;
import com.bee.pos.repository.ProductRepository;
import com.bee.pos.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class InventoryService {
    private static final Set<String> DECREASING = Set.of("OUT", "SALE");

    private final ProductRepository products;
    private final InventoryMovementRepository movements;

    @Transactional(readOnly = true)
    public List<MovementResponse> findAll(Long productId) {
        List<InventoryMovement> list = productId == null
            ? movements.findTop200ByOrderByCreatedAtDesc()
            : movements.findTop200ByProductIdOrderByCreatedAtDesc(productId);
        return list.stream().map(MovementResponse::from).toList();
    }

    @Transactional
    public MovementResponse stockIn(StockRequest request) {
        if (request.quantity() < 1) throw new BusinessException("Jumlah minimal 1");
        Product product = lock(request.productId());
        return MovementResponse.from(record(product, "IN", request.quantity(), noteOr(request.note(), "Stok masuk")));
    }

    @Transactional
    public MovementResponse stockOut(StockRequest request) {
        if (request.quantity() < 1) throw new BusinessException("Jumlah minimal 1");
        Product product = lock(request.productId());
        return MovementResponse.from(record(product, "OUT", request.quantity(), noteOr(request.note(), "Stok keluar")));
    }

    /** Stock opname: set the stock to the physically counted quantity and log the difference. */
    @Transactional
    public MovementResponse adjust(StockRequest request) {
        Product product = lock(request.productId());
        int diff = request.quantity() - product.getStock();
        product.setStock(request.quantity());
        products.save(product);
        String note = noteOr(request.note(), "Stock opname") + " (selisih " + (diff >= 0 ? "+" : "") + diff + ")";
        return MovementResponse.from(movements.save(InventoryMovement.builder()
            .product(product).quantity(Math.abs(diff)).type("ADJUST").note(note)
            .stockAfter(product.getStock()).createdBy(CurrentUser.username())
            .createdAt(OffsetDateTime.now()).build()));
    }

    /**
     * Applies a stock change and writes an audit row. The caller must already hold the product
     * (ideally locked via {@link ProductRepository#findByIdForUpdate}).
     */
    @Transactional
    public InventoryMovement record(Product product, String type, int quantity, String note) {
        int delta = DECREASING.contains(type) ? -quantity : quantity;
        if (product.getStock() + delta < 0) {
            throw new BusinessException("Stok " + product.getName() + " tidak cukup (tersisa " + product.getStock() + ")");
        }
        product.setStock(product.getStock() + delta);
        products.save(product);
        return movements.save(InventoryMovement.builder()
            .product(product).quantity(quantity).type(type).note(note)
            .stockAfter(product.getStock()).createdBy(CurrentUser.username())
            .createdAt(OffsetDateTime.now()).build());
    }

    public Product lock(Long productId) {
        return products.findByIdForUpdate(productId).orElseThrow(() -> NotFoundException.of("Produk", productId));
    }

    private static String noteOr(String note, String fallback) {
        return note == null || note.isBlank() ? fallback : note.trim();
    }
}
