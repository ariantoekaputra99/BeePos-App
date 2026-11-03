package com.bee.pos;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class PosFlowIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    String adminToken;

    @BeforeEach
    void login() throws Exception {
        adminToken = token("admin", "admin123");
    }

    @Test
    void rejectsRequestsWithoutTokenWith401() throws Exception {
        mvc.perform(get("/api/products")).andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void rejectsWrongPassword() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("username", "admin", "password", "wrong"))))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void fullSaleFlowUpdatesStockReportsAndVoidRestoresStock() throws Exception {
        long productId = createProduct("Kopi Susu", "KS-001", 10000, 6000, 10);

        JsonNode sale = body(call(post("/api/sales"), adminToken, Map.of(
            "items", new Object[]{Map.of("productId", productId, "quantity", 2), Map.of("productId", productId, "quantity", 1)},
            "paymentMethod", "CASH", "tax", 0, "discount", 5000, "amountPaid", 50000))
            .andExpect(status().isCreated()));

        assertThat(sale.get("subtotal").decimalValue()).isEqualByComparingTo("30000");
        assertThat(sale.get("total").decimalValue()).isEqualByComparingTo("25000");
        assertThat(sale.get("changeAmount").decimalValue()).isEqualByComparingTo("25000");
        assertThat(sale.get("items")).hasSize(1);
        assertThat(stock(productId)).isEqualTo(7);

        JsonNode dashboard = body(call(get("/api/dashboard/summary"), adminToken, null).andExpect(status().isOk()));
        assertThat(dashboard.get("todayOrders").asLong()).isEqualTo(1);
        assertThat(dashboard.get("todayRevenue").decimalValue()).isEqualByComparingTo("25000");
        assertThat(dashboard.get("todayProfit").decimalValue()).isEqualByComparingTo("7000");

        JsonNode report = body(call(get("/api/reports/sales"), adminToken, null).andExpect(status().isOk()));
        assertThat(report.get("totalOrders").asLong()).isEqualTo(1);
        assertThat(report.get("topProducts").get(0).get("quantity").asLong()).isEqualTo(3);

        call(post("/api/sales/" + sale.get("id").asLong() + "/void"), adminToken, Map.of("reason", "salah input"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("VOIDED"));
        assertThat(stock(productId)).isEqualTo(10);

        call(post("/api/sales/" + sale.get("id").asLong() + "/void"), adminToken, Map.of())
            .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsSaleWithInsufficientStockOrUnderpayment() throws Exception {
        long productId = createProduct("Roti", "RT-001", 5000, 3000, 2);
        call(post("/api/sales"), adminToken, Map.of(
            "items", new Object[]{Map.of("productId", productId, "quantity", 3)}, "paymentMethod", "CASH"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("tidak cukup")));
        call(post("/api/sales"), adminToken, Map.of(
            "items", new Object[]{Map.of("productId", productId, "quantity", 1)}, "paymentMethod", "CASH", "amountPaid", 1000))
            .andExpect(status().isBadRequest());
        assertThat(stock(productId)).isEqualTo(2);
    }

    @Test
    void purchaseOrderReceiveAddsStockOnlyOnce() throws Exception {
        long productId = createProduct("Gula", "GL-1", 15000, 12000, 0);
        JsonNode supplier = body(call(post("/api/suppliers"), adminToken, Map.of("name", "PT Pemasok"))
            .andExpect(status().isCreated()));
        JsonNode po = body(call(post("/api/purchases"), adminToken, Map.of(
            "supplierId", supplier.get("id").asLong(),
            "items", new Object[]{Map.of("productId", productId, "quantity", 20, "unitPrice", 12500)}))
            .andExpect(status().isCreated()));

        call(post("/api/purchases/" + po.get("id").asLong() + "/receive"), adminToken, null)
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("RECEIVED"));
        call(post("/api/purchases/" + po.get("id").asLong() + "/receive"), adminToken, null)
            .andExpect(status().isBadRequest());

        JsonNode product = body(call(get("/api/products/" + productId), adminToken, null));
        assertThat(product.get("stock").asInt()).isEqualTo(20);
        assertThat(product.get("costPrice").decimalValue()).isEqualByComparingTo("12500");
    }

    @Test
    void stockAdjustAndMovementsAreAudited() throws Exception {
        long productId = createProduct("Sabun", "SB-1", 4000, 3000, 10);
        call(post("/api/inventory/adjust"), adminToken, Map.of("productId", productId, "quantity", 7, "note", "Opname"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.stockAfter").value(7));
        call(post("/api/inventory/out"), adminToken, Map.of("productId", productId, "quantity", 50))
            .andExpect(status().isBadRequest());
        JsonNode movements = body(call(get("/api/inventory?productId=" + productId), adminToken, null));
        assertThat(movements).hasSize(2);
    }

    @Test
    void cashierCannotManageProductsOrUsersButCanSell() throws Exception {
        call(post("/api/users"), adminToken, Map.of("username", "kasir1", "email", "k1@x.com",
            "role", "CASHIER", "password", "rahasia1")).andExpect(status().isCreated());
        String cashier = token("kasir1", "rahasia1");

        call(post("/api/products"), cashier, Map.of("name", "X", "sku", "X-1", "price", 1, "costPrice", 1, "stock", 1))
            .andExpect(status().isForbidden());
        call(get("/api/users"), cashier, null).andExpect(status().isForbidden());
        call(get("/api/reports/sales"), cashier, null).andExpect(status().isForbidden());
        call(get("/api/dashboard/summary"), cashier, null).andExpect(status().isOk())
            .andExpect(jsonPath("$.grossProfit").value(org.hamcrest.Matchers.nullValue()))
            .andExpect(jsonPath("$.todayRevenue").exists());

        long productId = createProduct("Teh", "TH-1", 3000, 2000, 5);
        call(post("/api/sales"), cashier, Map.of("items", new Object[]{Map.of("productId", productId, "quantity", 1)},
            "paymentMethod", "QRIS")).andExpect(status().isCreated()).andExpect(jsonPath("$.cashier").value("kasir1"));
    }

    @Test
    void deactivatedUserCannotLogin() throws Exception {
        JsonNode user = body(call(post("/api/users"), adminToken, Map.of("username", "temp", "email", "t@x.com",
            "role", "MANAGER", "password", "rahasia1")).andExpect(status().isCreated()));
        call(delete("/api/users/" + user.get("id").asLong()), adminToken, null).andExpect(status().isNoContent());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("username", "temp", "password", "rahasia1"))))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void duplicateSkuIsRejectedAndDeleteIsSoft() throws Exception {
        long id = createProduct("A", "DUP-1", 1000, 500, 1);
        call(post("/api/products"), adminToken, Map.of("name", "B", "sku", "dup-1", "price", 1, "costPrice", 1, "stock", 0))
            .andExpect(status().isBadRequest());
        call(delete("/api/products/" + id), adminToken, null).andExpect(status().isNoContent());
        assertThat(body(call(get("/api/products"), adminToken, null))).isEmpty();
        assertThat(body(call(get("/api/products?includeInactive=true"), adminToken, null))).hasSize(1);
    }

    private long createProduct(String name, String sku, int price, int cost, int stock) throws Exception {
        return body(call(post("/api/products"), adminToken, Map.of(
            "name", name, "sku", sku, "price", price, "costPrice", cost, "stock", stock, "category", "Umum"))
            .andExpect(status().isCreated())).get("id").asLong();
    }

    private int stock(long productId) throws Exception {
        return body(call(get("/api/products/" + productId), adminToken, null)).get("stock").asInt();
    }

    private String token(String username, String password) throws Exception {
        return body(mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("username", username, "password", password))))
            .andExpect(status().isOk())).get("token").asText();
    }

    private ResultActions call(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder req,
                               String token, Object payload) throws Exception {
        req.header("Authorization", "Bearer " + token);
        if (payload != null) req.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(payload));
        return mvc.perform(req);
    }

    private JsonNode body(ResultActions result) throws Exception {
        return json.readTree(result.andReturn().getResponse().getContentAsString());
    }
}
