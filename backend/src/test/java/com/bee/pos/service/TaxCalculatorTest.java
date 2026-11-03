package com.bee.pos.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TaxCalculatorTest {
    private static BigDecimal bd(String v) { return new BigDecimal(v); }

    private static TaxCalculator.Line line(String amount, boolean taxable) {
        return new TaxCalculator.Line(bd(amount), taxable);
    }

    @Test
    void disabledTaxLeavesTotalUnchanged() {
        var r = TaxCalculator.calculate(List.of(line("100000", true)), bd("5000"), false, bd("11"), false);
        assertThat(r.tax()).isEqualByComparingTo("0");
        assertThat(r.total()).isEqualByComparingTo("95000");
    }

    @Test
    void exclusiveTaxIsAddedOnTop() {
        var r = TaxCalculator.calculate(List.of(line("100000", true)), BigDecimal.ZERO, true, bd("11"), false);
        assertThat(r.tax()).isEqualByComparingTo("11000");
        assertThat(r.total()).isEqualByComparingTo("111000");
    }

    @Test
    void exclusiveTaxAppliesAfterDiscount() {
        var r = TaxCalculator.calculate(List.of(line("100000", true)), bd("10000"), true, bd("11"), false);
        assertThat(r.taxBase()).isEqualByComparingTo("90000");
        assertThat(r.tax()).isEqualByComparingTo("9900");
        assertThat(r.total()).isEqualByComparingTo("99900");
    }

    @Test
    void inclusiveTaxIsExtractedAndTotalStaysTheSame() {
        var r = TaxCalculator.calculate(List.of(line("111000", true)), BigDecimal.ZERO, true, bd("11"), true);
        assertThat(r.tax()).isEqualByComparingTo("11000");
        assertThat(r.total()).isEqualByComparingTo("111000");
    }

    @Test
    void nonTaxableLinesAreExcludedAndDiscountIsAllocatedProportionally() {
        // 60k taxable + 40k exempt, 10k discount -> 6k of the discount hits the taxable part.
        var r = TaxCalculator.calculate(List.of(line("60000", true), line("40000", false)), bd("10000"),
            true, bd("10"), false);
        assertThat(r.taxBase()).isEqualByComparingTo("54000");
        assertThat(r.tax()).isEqualByComparingTo("5400");
        assertThat(r.total()).isEqualByComparingTo("95400");
    }

    @Test
    void taxIsRoundedToWholeRupiah() {
        var r = TaxCalculator.calculate(List.of(line("4500", true)), BigDecimal.ZERO, true, bd("11"), false);
        assertThat(r.tax()).isEqualByComparingTo("495");
        var r2 = TaxCalculator.calculate(List.of(line("4550", true)), BigDecimal.ZERO, true, bd("11"), false);
        assertThat(r2.tax()).isEqualByComparingTo("501"); // 500.5 -> 501
    }
}
