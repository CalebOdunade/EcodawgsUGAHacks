package com.example.demo.model;

public class NearestBinResponse {
  public Bin bin;
  public double distanceMeters;
  public double bearingDegrees;

  public NearestBinResponse() {}

  public NearestBinResponse(Bin bin, double distanceMeters, double bearingDegrees) {
    this.bin = bin;
    this.distanceMeters = distanceMeters;
    this.bearingDegrees = bearingDegrees;
  }
  
}


