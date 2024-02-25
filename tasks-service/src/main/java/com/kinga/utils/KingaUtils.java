package com.kinga.utils;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.util.StringUtils;

import java.util.Random;
import java.util.StringJoiner;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class KingaUtils {
    public static boolean isValidPhoneNumber(String phoneNumber) {
        if(phoneNumber== null || phoneNumber.length()==0)
            return true;
        String cleanedPhoneNumber = phoneNumber.replaceAll("\\s+", "").replaceAll("\\+", "");
        String regex = "^(261|0)(32|33|34|38)\\d{2}\\d{3}\\d{2}$";
        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(cleanedPhoneNumber);
        return matcher.matches();
    }

    public static String cleanPhonNumber(String phoneNumber){
        if (phoneNumber == null || phoneNumber.length() == 0) {
            return "";
        }
        String cleanedPhoneNumber = phoneNumber.replaceAll("\\s+", "");
        if(cleanedPhoneNumber.length()<9){
            throw new RuntimeException("Phone number "+phoneNumber +" is not correct");
        }
        return  "0"+(cleanedPhoneNumber.substring(cleanedPhoneNumber.length() - 9));
    }
    public static String separatePhoneNumber(String phoneNumber) {
        if(StringUtils.isEmpty(phoneNumber))
            return "";
        int[] insertIndices = {3, 5, 8};
        String cleanPhone = cleanPhonNumber(phoneNumber);
        StringBuilder stringBuilder = new StringBuilder(cleanPhone);

        for (int i = 0; i < insertIndices.length; i++) {
            int insertIndex = insertIndices[i] + i;
            stringBuilder.insert(insertIndex, " ");
        }

        return stringBuilder.toString();
    }
    public static String generateUsername(String firstName, String lastName) {
        String[] firstNameParts = firstName.split("\\s+");
        String[] lastNameParts = lastName.split("\\s+");
        StringJoiner joiner = new StringJoiner(".");
        for (String part : lastNameParts) {
            joiner.add(part);
        }
        for (String part : firstNameParts) {
            joiner.add(part.trim().substring(0, 1));
        }
        String username = joiner.toString() +"."+ new Random().nextInt(1000);;
        return username;
    }
    public static String encodePassword(String password){
        BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        return passwordEncoder.encode(password);
    }
}



