package com.bee.pos.service;

import com.bee.pos.entity.Product;
import com.bee.pos.exception.BusinessException;
import com.bee.pos.exception.NotFoundException;
import com.bee.pos.repository.ProductRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.Arrays;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Stores product images on the local filesystem (a Docker volume in production).
 * The file type is detected from the file's magic bytes, never from the client-supplied
 * name or Content-Type, and stored files get server-generated names.
 */
@Slf4j
@Service
public class ProductImageService {
    public static final long MAX_BYTES = 2 * 1024 * 1024;
    private static final Pattern SAFE_NAME = Pattern.compile("product-\\d+-[a-f0-9]{32}\\.(jpg|png|webp)");

    private final ProductRepository products;
    private final Path root;

    public ProductImageService(ProductRepository products, @Value("${app.upload-dir:./uploads}") String uploadDir) {
        this.products = products;
        this.root = Paths.get(uploadDir).toAbsolutePath().normalize().resolve("products");
    }

    public record StoredImage(Path path, MediaType mediaType) {}

    @Transactional
    public Product upload(Long productId, MultipartFile file) {
        Product product = products.findById(productId).orElseThrow(() -> NotFoundException.of("Produk", productId));
        if (file == null || file.isEmpty()) throw new BusinessException("File gambar kosong");
        if (file.getSize() > MAX_BYTES) throw new BusinessException("Ukuran gambar maksimal 2 MB");

        byte[] data;
        try (InputStream in = file.getInputStream()) {
            data = in.readNBytes((int) MAX_BYTES + 1);
        } catch (IOException e) {
            throw new BusinessException("Gagal membaca file gambar");
        }
        if (data.length > MAX_BYTES) throw new BusinessException("Ukuran gambar maksimal 2 MB");
        String ext = detectExtension(data);
        if (ext == null) throw new BusinessException("Format gambar harus JPG, PNG, atau WebP");

        String name = "product-" + productId + "-" + UUID.randomUUID().toString().replace("-", "") + "." + ext;
        try {
            Files.createDirectories(root);
            Path target = root.resolve(name);
            Path tmp = Files.createTempFile(root, "upload-", ".tmp");
            Files.write(tmp, data);
            Files.move(tmp, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException e) {
            log.error("Failed to store product image", e);
            throw new BusinessException("Gagal menyimpan gambar di server");
        }

        String old = product.getImageFile();
        product.setImageFile(name);
        Product saved = products.save(product);
        deleteQuietly(old);
        return saved;
    }

    @Transactional
    public Product delete(Long productId) {
        Product product = products.findById(productId).orElseThrow(() -> NotFoundException.of("Produk", productId));
        String old = product.getImageFile();
        product.setImageFile(null);
        Product saved = products.save(product);
        deleteQuietly(old);
        return saved;
    }

    public StoredImage load(Long productId) {
        Product product = products.findById(productId).orElseThrow(() -> NotFoundException.of("Produk", productId));
        Path path = resolve(product.getImageFile());
        if (path == null || !Files.isRegularFile(path)) throw new NotFoundException("Gambar produk tidak ditemukan");
        String name = path.getFileName().toString();
        MediaType type = name.endsWith(".png") ? MediaType.IMAGE_PNG
            : name.endsWith(".webp") ? MediaType.parseMediaType("image/webp") : MediaType.IMAGE_JPEG;
        return new StoredImage(path, type);
    }

    private Path resolve(String name) {
        if (name == null || !SAFE_NAME.matcher(name).matches()) return null;
        Path path = root.resolve(name).normalize();
        return path.startsWith(root) ? path : null;
    }

    private void deleteQuietly(String name) {
        Path path = resolve(name);
        if (path == null) return;
        try {
            Files.deleteIfExists(path);
        } catch (IOException e) {
            log.warn("Could not delete old product image {}", name, e);
        }
    }

    static String detectExtension(byte[] d) {
        if (d.length >= 3 && (d[0] & 0xFF) == 0xFF && (d[1] & 0xFF) == 0xD8 && (d[2] & 0xFF) == 0xFF) return "jpg";
        if (d.length >= 8 && Arrays.equals(Arrays.copyOf(d, 8),
            new byte[]{(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'})) return "png";
        if (d.length >= 12 && d[0] == 'R' && d[1] == 'I' && d[2] == 'F' && d[3] == 'F'
            && d[8] == 'W' && d[9] == 'E' && d[10] == 'B' && d[11] == 'P') return "webp";
        return null;
    }
}
