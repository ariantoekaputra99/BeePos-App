package com.bee.pos.controller;

import com.bee.pos.entity.Product;
import com.bee.pos.service.ProductImageService;
import com.bee.pos.service.ProductService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import java.time.Duration;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService products;
    private final ProductImageService images;

    @GetMapping
    public List<Product> list(@RequestParam(required = false) String q,
                              @RequestParam(required = false) String category,
                              @RequestParam(defaultValue = "false") boolean includeInactive,
                              @RequestParam(defaultValue = "false") boolean lowStock) {
        return products.search(q, category, includeInactive, lowStock);
    }

    @GetMapping("/{id}")
    public Product get(@PathVariable Long id) {
        return products.get(id);
    }

    @GetMapping("/code/{code}")
    public Product byCode(@PathVariable String code) {
        return products.findByCode(code);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Product> create(@Valid @RequestBody Product product) {
        return ResponseEntity.status(HttpStatus.CREATED).body(products.create(product));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Product update(@PathVariable Long id, @Valid @RequestBody Product product) {
        return products.update(id, product);
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Product uploadImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return images.upload(id, file);
    }

    @DeleteMapping("/{id}/image")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Product deleteImage(@PathVariable Long id) {
        return images.delete(id);
    }

    /** Public so it works in plain &lt;img&gt; tags (which cannot send the Bearer token). */
    @GetMapping("/{id}/image")
    public ResponseEntity<Resource> image(@PathVariable Long id) {
        ProductImageService.StoredImage img = images.load(id);
        return ResponseEntity.ok()
            .contentType(img.mediaType())
            .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
            .body(new FileSystemResource(img.path()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        products.delete(id);
        return ResponseEntity.noContent().build();
    }
}
