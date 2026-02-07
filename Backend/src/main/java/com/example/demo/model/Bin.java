package com.example.demo.model;

public class Bin {
  public long id;
  public String name;
  public String description;
  public double lat;
  public double lng;

  public Bin() {}
  public Bin(long id, String name, String description, double lat, double lng) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.lat = lat;
    this.lng = lng;
  }
}
