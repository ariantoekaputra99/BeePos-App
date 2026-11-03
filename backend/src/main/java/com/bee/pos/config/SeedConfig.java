package com.bee.pos.config;

import com.bee.pos.entity.*;
import com.bee.pos.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@Configuration
public class SeedConfig {

    @Bean
    CommandLineRunner seed(UserRepository users, ProductRepository products, CategoryRepository categories,
                           CustomerRepository customers, SupplierRepository suppliers,
                           InventoryMovementRepository movements, PasswordEncoder encoder,
                           TransactionTemplate tx,
                           @Value("${app.seed.admin-password:admin123}") String adminPassword,
                           @Value("${app.seed.demo-data:false}") boolean demoData) {
        return args -> tx.executeWithoutResult(status -> {
            if (users.findByUsername("admin").isEmpty()) {
                users.save(User.builder().username("admin").email("admin@beepos.local").fullName("Administrator")
                    .password(encoder.encode(adminPassword)).role(Role.ADMIN).active(true).build());
                log.info("Seeded default admin user 'admin'");
            }
            if (!demoData) return;

            if (users.findByUsername("manager").isEmpty()) {
                users.save(User.builder().username("manager").email("manager@beepos.local").fullName("Manajer Toko")
                    .password(encoder.encode("manager123")).role(Role.MANAGER).active(true).build());
            }
            if (users.findByUsername("kasir").isEmpty()) {
                users.save(User.builder().username("kasir").email("kasir@beepos.local").fullName("Kasir 1")
                    .password(encoder.encode("kasir123")).role(Role.CASHIER).active(true).build());
            }
            if (products.count() > 0) return;

            for (String name : List.of("Sembako", "Minuman", "Makanan Ringan", "Kebutuhan Rumah")) {
                if (categories.findByNameIgnoreCase(name).isEmpty()) {
                    categories.save(Category.builder().name(name).build());
                }
            }
            Object[][] demo = {
                {"Beras Premium 5kg", "BR-005", "8991000000011", 72000, 62000, 24, "Sembako", "karung"},
                {"Minyak Goreng 2L", "MG-002", "8991000000028", 34000, 28000, 16, "Sembako", "botol"},
                {"Gula Pasir 1kg", "GL-001", "8991000000035", 17500, 14500, 30, "Sembako", "pack"},
                {"Telur Ayam 1kg", "TL-001", "8991000000042", 28000, 24500, 4, "Sembako", "kg"},
                {"Air Mineral 600ml", "AM-600", "8991000000059", 4000, 2500, 120, "Minuman", "botol"},
                {"Teh Botol 450ml", "TB-450", "8991000000066", 6000, 4200, 48, "Minuman", "botol"},
                {"Kopi Sachet", "KP-001", "8991000000073", 2000, 1300, 200, "Minuman", "sachet"},
                {"Keripik Kentang 68g", "KK-068", "8991000000080", 11000, 8000, 3, "Makanan Ringan", "pcs"},
                {"Biskuit Cokelat", "BS-001", "8991000000097", 9500, 7000, 36, "Makanan Ringan", "pcs"},
                {"Sabun Mandi 85g", "SB-085", "8991000000103", 4500, 3200, 60, "Kebutuhan Rumah", "pcs"},
                {"Deterjen 800g", "DT-800", "8991000000110", 23000, 19000, 12, "Kebutuhan Rumah", "pack"},
                {"Pasta Gigi 190g", "PG-190", "8991000000127", 15000, 11500, 25, "Kebutuhan Rumah", "pcs"},
            };
            for (Object[] row : demo) {
                Product p = products.save(Product.builder()
                    .name((String) row[0]).sku((String) row[1]).barcode((String) row[2])
                    .price(BigDecimal.valueOf((Integer) row[3])).costPrice(BigDecimal.valueOf((Integer) row[4]))
                    .stock((Integer) row[5]).minStock(5).category((String) row[6]).unit((String) row[7])
                    .active(true).build());
                movements.save(InventoryMovement.builder().product(p).quantity(p.getStock()).type("IN")
                    .note("Stok awal (data demo)").stockAfter(p.getStock()).createdBy("system")
                    .createdAt(OffsetDateTime.now()).build());
            }
            customers.save(Customer.builder().name("Budi Santoso").phone("081234567890").email("budi@example.com").build());
            customers.save(Customer.builder().name("Siti Rahma").phone("081298765432").build());
            suppliers.save(Supplier.builder().name("PT Sumber Pangan").contactPerson("Andi").phone("0215550101").build());
            suppliers.save(Supplier.builder().name("CV Segar Minuman").contactPerson("Rina").phone("0215550202").build());
            log.info("Seeded demo data (users manager/kasir, {} products)", demo.length);
        });
    }
}
