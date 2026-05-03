package com.tradingjournal.trade.dto;

import com.tradingjournal.trade.Side;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record TradeRequest(
    @NotBlank String symbol,
    @NotNull Side side,
    @NotNull LocalDate entryDate,
    LocalDate exitDate,
    @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal entryPrice,
    @DecimalMin(value = "0.0", inclusive = false) BigDecimal exitPrice,
    @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal quantity,
    @DecimalMin("0.0") BigDecimal fees,
    String strategy,
    String setup,
    List<String> tags,
    String notes,
    String emotion,
    String marketCondition,
    @DecimalMin(value = "0.0", inclusive = false) BigDecimal riskAmount,
    @Min(1) @Max(5) Integer rating) {
}
