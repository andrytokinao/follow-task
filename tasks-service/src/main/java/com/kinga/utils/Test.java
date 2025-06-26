package com.kinga.utils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Test {
    public static void main(String[] args) {
        List<String> images = Arrays.asList(
                "/home/tandriamahefasoa/Images/Screenshots-old/Screenshot_20250420_115734_com.facebook.lite.jpg",
                "/home/tandriamahefasoa/Images/Screenshots-old/Screenshot_20250420_162154_com.facebook.lite.jpg",
                "/home/tandriamahefasoa/Images/Screenshots-old/Screenshot_20250421_105854_com.facebook.lite.jpg",
                "/home/tandriamahefasoa/Images/Screenshots-old/Screenshot_20250421_110018_com.facebook.lite.jpg",
                "/home/tandriamahefasoa/Images/Screenshots-old/Screenshot_20250421_115910_com.facebook.lite.jpg",
                "/home/tandriamahefasoa/Images/Screenshots-old/Screenshot_20250421_203513_com.facebook.lite.jpg",
                "/home/tandriamahefasoa/Images/Screenshots-old/Screenshot_20250421_203859_com.facebook.lite.jpg",
                "/home/tandriamahefasoa/Images/Screenshots-old/Screenshot_20250421_203926_com.facebook.lite.jpg",
                "/home/tandriamahefasoa/Images/Screenshots-old/Screenshot_20250422_211814_com.facebook.lite.jpg",
                "/home/tandriamahefasoa/Images/Screenshots-old/Screenshot_20250422_223436_com.facebook.orca.jpg");
      List<String> encriped = new ArrayList<>();
      for (String im : images) {
          encriped.add(KingaUtils.encodeText(im));
      }
        System.out.println(encriped);
    }
}
