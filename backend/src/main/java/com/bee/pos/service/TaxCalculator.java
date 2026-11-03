package com.bee.pos.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Pure tax math shared by checkout (and mirrored in the frontend for the live preview).
 *
 * <ul>
 *   <li>The discount is applied to the whole cart and allocated proportionally to taxable lines.</li>
 *   <li>Exclusive: tax = taxable base x rate, added on top of (subtotal - discount).</li>
 *   <li>Inclusive: prices already contain tax; tax = base - base / (1 + rate) is reported but
 *       the total stays (subtotal - discount).</li>
 *   <li>Tax is rounded to whole rupiah (HALF_UP).</li>
 * </ul>
 */
public final class TaxCalculator {
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private TaxCalculator() {}

    public record Line(BigDecimal amount, boolean taxable) {}

    public record Result(BigDecimal subtotal, BigDecimal discount, BigDecimal taxBase, BigDecimal tax, BigDecimal total) {}

    public static Result calculate(List<Line> lines, BigDecimal discount, boolean enabled,
                                   BigDecimal ratePercent, boolean inclusive) {
        BigDecimal subtotal = lines.stream().map(Line::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal disc = discount == null ? BigDecimal.ZERO : discount;
        BigDecimal afterDiscount = subtotal.subtract(disc);

        if (!enabled || ratePercent == null || ratePercent.signum() <= 0 || subtotal.signum() == 0) {
            return new Result(scale(subtotal), scale(disc), BigDecimal.ZERO.setScale(2), BigDecimal.ZERO.setScale(2), scale(afterDiscount));
        }

        BigDecimal taxableSubtotal = lines.stream().filter(Line::taxable).map(Line::amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal taxableDiscount = disc.multiply(taxableSubtotal).divide(subtotal, 10, RoundingMode.HALF_UP);
        BigDecimal base = taxableSubtotal.subtract(taxableDiscount);
        BigDecimal rate = ratePercent.divide(HUNDRED, 10, RoundingMode.HALF_UP);

        BigDecimal tax;
        BigDecimal total;
        if (inclusive) {
            tax = base.subtract(base.divide(BigDecimal.ONE.add(rate), 10, RoundingMode.HALF_UP));
            total = afterDiscount;
        } else {
            tax = base.multiply(rate);
            total = null; // computed after rounding the tax
        }
        tax = tax.setScale(0, RoundingMode.HALF_UP);
        if (total == null) total = afterDiscount.add(tax);
        return new Result(scale(subtotal), scale(disc), scale(base), scale(tax), scale(total));
    }

    private static BigDecimal scale(BigDecimal v) {
        return v.setScale(2, RoundingMode.HALF_UP);
    }
}
