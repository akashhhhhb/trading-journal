package com.tradingjournal.trade;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("trades")
public class Trade {

  @Id
  private String id;

  @Indexed
  private String symbol;

  private Side side;
  private LocalDate entryDate;
  private LocalDate exitDate;
  private BigDecimal entryPrice;
  private BigDecimal exitPrice;
  private BigDecimal quantity;
  private BigDecimal fees = BigDecimal.ZERO;
  private String strategy;
  private String setup;
  private List<String> tags = new ArrayList<>();
  private String notes;
  private String emotion;
  private String marketCondition;
  private BigDecimal riskAmount;
  private Integer rating;

  @CreatedDate
  private Instant createdAt;

  @LastModifiedDate
  private Instant updatedAt;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getSymbol() {
    return symbol;
  }

  public void setSymbol(String symbol) {
    this.symbol = symbol;
  }

  public Side getSide() {
    return side;
  }

  public void setSide(Side side) {
    this.side = side;
  }

  public LocalDate getEntryDate() {
    return entryDate;
  }

  public void setEntryDate(LocalDate entryDate) {
    this.entryDate = entryDate;
  }

  public LocalDate getExitDate() {
    return exitDate;
  }

  public void setExitDate(LocalDate exitDate) {
    this.exitDate = exitDate;
  }

  public BigDecimal getEntryPrice() {
    return entryPrice;
  }

  public void setEntryPrice(BigDecimal entryPrice) {
    this.entryPrice = entryPrice;
  }

  public BigDecimal getExitPrice() {
    return exitPrice;
  }

  public void setExitPrice(BigDecimal exitPrice) {
    this.exitPrice = exitPrice;
  }

  public BigDecimal getQuantity() {
    return quantity;
  }

  public void setQuantity(BigDecimal quantity) {
    this.quantity = quantity;
  }

  public BigDecimal getFees() {
    return fees;
  }

  public void setFees(BigDecimal fees) {
    this.fees = fees;
  }

  public String getStrategy() {
    return strategy;
  }

  public void setStrategy(String strategy) {
    this.strategy = strategy;
  }

  public String getSetup() {
    return setup;
  }

  public void setSetup(String setup) {
    this.setup = setup;
  }

  public List<String> getTags() {
    return tags;
  }

  public void setTags(List<String> tags) {
    this.tags = tags;
  }

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes;
  }

  public String getEmotion() {
    return emotion;
  }

  public void setEmotion(String emotion) {
    this.emotion = emotion;
  }

  public String getMarketCondition() {
    return marketCondition;
  }

  public void setMarketCondition(String marketCondition) {
    this.marketCondition = marketCondition;
  }

  public BigDecimal getRiskAmount() {
    return riskAmount;
  }

  public void setRiskAmount(BigDecimal riskAmount) {
    this.riskAmount = riskAmount;
  }

  public Integer getRating() {
    return rating;
  }

  public void setRating(Integer rating) {
    this.rating = rating;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }
}
