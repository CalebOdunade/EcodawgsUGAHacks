package com.example.demo.controller;

import com.example.demo.model.Bin;
import com.example.demo.service.BinService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.example.demo.model.NearestBinResponse;

import java.util.List;

@RestController
@RequestMapping("/api/bins")
@CrossOrigin(origins = "*")
public class BinController {

    private final BinService service;

    public BinController(BinService service) {
        this.service = service;
    }

    @GetMapping
    public List<Bin> all() {
        return service.all();
    }

    @GetMapping("/nearest")
    public NearestBinResponse nearest(
            @RequestParam double lat,
            @RequestParam double lng) {
        return service.nearestInfo(lat, lng);
    }

}
