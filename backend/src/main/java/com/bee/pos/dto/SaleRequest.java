package com.bee.pos.dto;

import com.bee.pos.entity.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;

public record SaleRequest(@NotEmpty List<@Valid Item> items, @NotNull PaymentMethod paymentMethod, double tax, double discount) {
    public record Item(@NotNull Long productId, @Min(1) int quantity) {}
}
