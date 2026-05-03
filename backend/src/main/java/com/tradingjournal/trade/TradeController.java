package com.tradingjournal.trade;

import com.tradingjournal.trade.dto.TradeRequest;
import com.tradingjournal.trade.dto.TradeResponse;
import com.tradingjournal.trade.dto.TradeStatsResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trades")
public class TradeController {

  private final TradeService service;

  public TradeController(TradeService service) {
    this.service = service;
  }

  @GetMapping
  public List<TradeResponse> list(
      @RequestParam(required = false) String symbol,
      @RequestParam(required = false) Side side,
      @RequestParam(required = false) String strategy) {
    return service.findTrades(symbol, side, strategy);
  }

  @GetMapping("/{id}")
  public TradeResponse get(@PathVariable String id) {
    return service.findById(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public TradeResponse create(@Valid @RequestBody TradeRequest request) {
    return service.create(request);
  }

  @PostMapping("/import")
  @ResponseStatus(HttpStatus.CREATED)
  public List<TradeResponse> importTrades(@Valid @RequestBody List<@Valid TradeRequest> requests) {
    return service.createAll(requests);
  }

  @PutMapping("/{id}")
  public TradeResponse update(@PathVariable String id, @Valid @RequestBody TradeRequest request) {
    return service.update(id, request);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable String id) {
    service.delete(id);
  }

  @GetMapping("/stats")
  public TradeStatsResponse stats() {
    return service.stats();
  }
}
