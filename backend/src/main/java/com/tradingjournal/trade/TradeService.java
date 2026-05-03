package com.tradingjournal.trade;

import com.tradingjournal.trade.dto.TradeRequest;
import com.tradingjournal.trade.dto.TradeResponse;
import com.tradingjournal.trade.dto.TradeStatsResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class TradeService {

  private static final int MONEY_SCALE = 2;
  private static final int RATIO_SCALE = 2;

  private final TradeRepository repository;

  public TradeService(TradeRepository repository) {
    this.repository = repository;
  }

  public List<TradeResponse> findTrades(String symbol, Side side, String strategy) {
    return repository.findAll(Sort.by(Sort.Direction.DESC, "entryDate", "createdAt")).stream()
        .filter(trade -> matches(symbol, trade.getSymbol()))
        .filter(trade -> side == null || trade.getSide() == side)
        .filter(trade -> matches(strategy, trade.getStrategy()))
        .map(this::toResponse)
        .toList();
  }

  public TradeResponse findById(String id) {
    return repository.findById(id)
        .map(this::toResponse)
        .orElseThrow(() -> new TradeNotFoundException(id));
  }

  public TradeResponse create(TradeRequest request) {
    Trade trade = new Trade();
    applyRequest(trade, request);
    return toResponse(repository.save(trade));
  }

  public TradeResponse update(String id, TradeRequest request) {
    Trade trade = repository.findById(id).orElseThrow(() -> new TradeNotFoundException(id));
    applyRequest(trade, request);
    return toResponse(repository.save(trade));
  }

  public void delete(String id) {
    if (!repository.existsById(id)) {
      throw new TradeNotFoundException(id);
    }
    repository.deleteById(id);
  }

  public TradeStatsResponse stats() {
    List<TradeResponse> trades = repository.findAll().stream().map(this::toResponse).toList();
    List<TradeResponse> closed = trades.stream().filter(trade -> trade.status() == TradeStatus.CLOSED).toList();
    BigDecimal gross = closed.stream().map(TradeResponse::grossPnl).reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal net = closed.stream().map(TradeResponse::netPnl).reduce(BigDecimal.ZERO, BigDecimal::add);
    long wins = closed.stream().filter(trade -> isPositive(trade.netPnl())).count();
    long losses = closed.stream().filter(trade -> isNegative(trade.netPnl())).count();
    BigDecimal averageR = closed.stream()
        .map(TradeResponse::rMultiple)
        .filter(value -> value != null)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    long rCount = closed.stream().filter(trade -> trade.rMultiple() != null).count();

    return new TradeStatsResponse(
        trades.size(),
        trades.size() - closed.size(),
        closed.size(),
        wins,
        losses,
        closed.isEmpty() ? BigDecimal.ZERO : percent(BigDecimal.valueOf(wins), BigDecimal.valueOf(closed.size())),
        money(gross),
        money(net),
        rCount == 0 ? BigDecimal.ZERO : ratio(averageR, BigDecimal.valueOf(rCount)),
        closed.stream().map(TradeResponse::netPnl).max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO),
        closed.stream().map(TradeResponse::netPnl).min(Comparator.naturalOrder()).orElse(BigDecimal.ZERO));
  }

  private void applyRequest(Trade trade, TradeRequest request) {
    trade.setSymbol(request.symbol().trim().toUpperCase(Locale.ROOT));
    trade.setSide(request.side());
    trade.setEntryDate(request.entryDate());
    trade.setExitDate(request.exitDate());
    trade.setEntryPrice(request.entryPrice());
    trade.setExitPrice(request.exitPrice());
    trade.setQuantity(request.quantity());
    trade.setFees(request.fees() == null ? BigDecimal.ZERO : request.fees());
    trade.setStrategy(blankToNull(request.strategy()));
    trade.setSetup(blankToNull(request.setup()));
    trade.setTags(cleanTags(request.tags()));
    trade.setNotes(blankToNull(request.notes()));
    trade.setEmotion(blankToNull(request.emotion()));
    trade.setMarketCondition(blankToNull(request.marketCondition()));
    trade.setRiskAmount(request.riskAmount());
    trade.setRating(request.rating());
  }

  private TradeResponse toResponse(Trade trade) {
    TradeStatus status = trade.getExitPrice() == null ? TradeStatus.OPEN : TradeStatus.CLOSED;
    BigDecimal grossPnl = status == TradeStatus.CLOSED ? grossPnl(trade) : null;
    BigDecimal netPnl = grossPnl == null ? null : money(grossPnl.subtract(defaultZero(trade.getFees())));
    BigDecimal rMultiple = netPnl == null || trade.getRiskAmount() == null ? null : ratio(netPnl, trade.getRiskAmount());

    return new TradeResponse(
        trade.getId(),
        trade.getSymbol(),
        trade.getSide(),
        trade.getEntryDate(),
        trade.getExitDate(),
        trade.getEntryPrice(),
        trade.getExitPrice(),
        trade.getQuantity(),
        defaultZero(trade.getFees()),
        trade.getStrategy(),
        trade.getSetup(),
        trade.getTags() == null ? List.of() : trade.getTags(),
        trade.getNotes(),
        trade.getEmotion(),
        trade.getMarketCondition(),
        trade.getRiskAmount(),
        trade.getRating(),
        grossPnl,
        netPnl,
        rMultiple,
        status,
        trade.getCreatedAt() == null ? Instant.EPOCH : trade.getCreatedAt(),
        trade.getUpdatedAt() == null ? Instant.EPOCH : trade.getUpdatedAt());
  }

  private BigDecimal grossPnl(Trade trade) {
    BigDecimal priceMove = trade.getSide() == Side.LONG
        ? trade.getExitPrice().subtract(trade.getEntryPrice())
        : trade.getEntryPrice().subtract(trade.getExitPrice());
    return money(priceMove.multiply(trade.getQuantity()));
  }

  private boolean matches(String filter, String value) {
    if (filter == null || filter.isBlank()) {
      return true;
    }
    return value != null && value.toLowerCase(Locale.ROOT).contains(filter.toLowerCase(Locale.ROOT));
  }

  private List<String> cleanTags(List<String> tags) {
    if (tags == null) {
      return List.of();
    }
    return tags.stream()
        .map(String::trim)
        .filter(tag -> !tag.isBlank())
        .map(tag -> tag.toLowerCase(Locale.ROOT))
        .distinct()
        .toList();
  }

  private String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  private BigDecimal defaultZero(BigDecimal value) {
    return value == null ? BigDecimal.ZERO : value;
  }

  private BigDecimal money(BigDecimal value) {
    return value.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
  }

  private BigDecimal ratio(BigDecimal numerator, BigDecimal denominator) {
    if (denominator.compareTo(BigDecimal.ZERO) == 0) {
      return BigDecimal.ZERO;
    }
    return numerator.divide(denominator, RATIO_SCALE, RoundingMode.HALF_UP);
  }

  private BigDecimal percent(BigDecimal numerator, BigDecimal denominator) {
    return ratio(numerator.multiply(BigDecimal.valueOf(100)), denominator);
  }

  private boolean isPositive(BigDecimal value) {
    return value != null && value.compareTo(BigDecimal.ZERO) > 0;
  }

  private boolean isNegative(BigDecimal value) {
    return value != null && value.compareTo(BigDecimal.ZERO) < 0;
  }
}
