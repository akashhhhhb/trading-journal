package com.tradingjournal.trade.dto;

import com.tradingjournal.trade.Side;
import com.tradingjournal.trade.TradeStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record TradeResponse(
    String id,
    String symbol,
    Side side,
    LocalDate entryDate,
    LocalDate exitDate,
    BigDecimal entryPrice,
    BigDecimal exitPrice,
    BigDecimal quantity,
    BigDecimal fees,
    String strategy,
    String setup,
    List<String> tags,
    String notes,
    String emotion,
    String marketCondition,
    BigDecimal riskAmount,
    Integer rating,
    BigDecimal grossPnl,
    BigDecimal netPnl,
    BigDecimal rMultiple,
    TradeStatus status,
    Instant createdAt,
    Instant updatedAt) {
}
