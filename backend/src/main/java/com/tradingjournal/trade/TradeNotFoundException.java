package com.tradingjournal.trade;

public class TradeNotFoundException extends RuntimeException {

  public TradeNotFoundException(String id) {
    super("Trade not found: " + id);
  }
}
