package com.tradingjournal.trade.dto;

import java.math.BigDecimal;

public record TradeStatsResponse(
    long totalTrades,
    long openTrades,
    long closedTrades,
    long wins,
    long losses,
    BigDecimal winRate,
    BigDecimal grossPnl,
    BigDecimal netPnl,
    BigDecimal averageR,
    BigDecimal bestTrade,
    BigDecimal worstTrade) {
}
