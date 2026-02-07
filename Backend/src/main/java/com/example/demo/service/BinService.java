package com.example.demo.service;
import com.example.demo.model.NearestBinResponse;
import com.example.demo.util.Geo;

import com.example.demo.model.Bin;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class BinService {
    private final List<Bin> bins;

    public BinService() throws IOException {
        this.bins = loadBinsFromCsv("bins.csv");
        System.out.println("Loaded bins: " + bins.size());
    }

    public List<Bin> all() {
        return bins;
    }
    public NearestBinResponse nearestInfo(double userLat, double userLng) {
        Bin best = null;
        double bestDist = Double.POSITIVE_INFINITY;

        for (Bin b : bins) {
            double d = Geo.haversineMeters(userLat, userLng, b.lat, b.lng);
            if (d < bestDist) {
            bestDist = d;
            best = b;
            }
        }

        if (best == null) return new NearestBinResponse(null, 0, 0);

        double bearing = Geo.bearingDegrees(userLat, userLng, best.lat, best.lng);
        return new NearestBinResponse(best, bestDist, bearing);
    }

    private static List<Bin> loadBinsFromCsv(String resourceName) throws IOException {
        ClassPathResource res = new ClassPathResource(resourceName);

        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(res.getInputStream(), StandardCharsets.UTF_8))) {

            String headerLine = br.readLine();
            if (headerLine == null)
                return List.of();

            String[] headers = splitCsv(headerLine);
            Map<String, Integer> idx = headerIndex(headers);

            // required (based on your data)
            int descI = must(idx, "PopupInfo");
            int lngI = must(idx, "X_Field"); // longitude
            int latI = must(idx, "Y"); // latitude

            // optional
            int nameI = idx.getOrDefault("Name", -1);

            List<Bin> out = new ArrayList<>();
            String line;
            long id = 1;

            while ((line = br.readLine()) != null) {
                if (line.isBlank())
                    continue;
                String[] row = splitCsv(line);

                String desc = get(row, descI);
                double lng = parseDouble(get(row, lngI));
                double lat = parseDouble(get(row, latI));

                String name = (nameI >= 0 && !get(row, nameI).isBlank())
                        ? get(row, nameI)
                        : "Compost Bin " + id;

                // skip junk rows
                if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001)
                    continue;

                out.add(new Bin(id++, name, desc, lat, lng));
            }

            return out;
        }
    }

    // ---- helpers ----
    private static Map<String, Integer> headerIndex(String[] headers) {
        Map<String, Integer> m = new HashMap<>();
        for (int i = 0; i < headers.length; i++) {
            m.put(headers[i].trim().replace("\uFEFF", ""), i);
        }
        return m;
    }

    private static int must(Map<String, Integer> idx, String col) {
        Integer i = idx.get(col);
        if (i == null)
            throw new IllegalArgumentException("Missing CSV column: " + col);
        return i;
    }

    private static String get(String[] row, int i) {
        if (i < 0 || i >= row.length)
            return "";
        return row[i].trim().replaceAll("^\"|\"$", "");
    }

    private static double parseDouble(String s) {
        if (s == null || s.isBlank())
            return 0;
        return Double.parseDouble(s);
    }

    private static String[] splitCsv(String line) {
        List<String> parts = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"')
                inQuotes = !inQuotes;
            else if (c == ',' && !inQuotes) {
                parts.add(cur.toString());
                cur.setLength(0);
            } else
                cur.append(c);
        }
        parts.add(cur.toString());
        return parts.toArray(new String[0]);
    }

    public Bin nearest(double lat, double lng) {
        Bin best = null;
        double bestDist = Double.MAX_VALUE;
        for (Bin b : bins) {
            double d = dist2(b.lat, b.lng, lat, lng);
            if (d < bestDist) {
                bestDist = d;
                best = b;
            }
        }
        return best;
    }

    private static double dist2(double aLat, double aLng, double bLat, double bLng) {
        double dLat = aLat - bLat;
        double dLng = aLng - bLng;
        return dLat * dLat + dLng * dLng;
    }
    
}
