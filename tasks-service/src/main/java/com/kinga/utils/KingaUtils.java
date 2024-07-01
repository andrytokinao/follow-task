package com.kinga.utils;

import com.kinga.tasksservice.entity.Project;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.util.StringUtils;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Random;
import java.util.StringJoiner;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.kinga.tasksservice.entity.Project.BASE_DIRECTORY;

public class KingaUtils {
    private static final String WORKWPACE = "WORK_SPACE";
    private static final String MEDIA_SPACE = "MEDIA_SPACE" ;
    private static String SUFFLE_STRING ="tLR4hpeTaQjvGHC0S2zogWPkyq5d3cuMKXlm7FDfiI-BAEJ_Uns/6ZO9YVb1wxrN8";
    private static String NORMAL_STRING = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/-_";
    public static boolean isValidPhoneNumber(String phoneNumber) {
        if (StringUtils.isEmpty(phoneNumber))
            return true;
        String cleanedPhoneNumber = phoneNumber.replaceAll("\\s+", "").replaceAll("\\+", "");
        String regex = "^(261|0)(32|33|34|38)\\d{2}\\d{3}\\d{2}$";
        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(cleanedPhoneNumber);
        return matcher.matches();
    }

    public static String cleanPhonNumber(String phoneNumber){
        if (StringUtils.isEmpty(phoneNumber)) {
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
    public static String encodeText(String text) {
        char[] toChange = text.toCharArray();
        char[] changes  = new char[toChange.length];
        int i = 0;
        for(char chr:toChange){
            changes[i] = NORMAL_STRING.indexOf(chr) ==-1? chr : SUFFLE_STRING.charAt(NORMAL_STRING.indexOf(chr));
            i++;
        }
        return new String(changes);
    }
    public static String decodeText(String text) {
        char[] toChange = text.toCharArray();
        char[] changes  = new char[toChange.length];
        int i = 0;
        for(char chr:toChange){
            changes[i] =  SUFFLE_STRING.indexOf(chr)==-1? chr : NORMAL_STRING.charAt(SUFFLE_STRING.indexOf(chr));
            i++;
        }
        return new String(changes);
    }
    public static String getDefaultWorkSpaceDirectory(){
        return baseDirectory ()+File.separator+WORKWPACE;
    }
    public static String getDefaultMediaSpaceDirectory(){
        return baseDirectory ()+File.separator+MEDIA_SPACE;
    }
    public static String baseDirectory(){
         return System.getProperty("user.home")+ File.separator+BASE_DIRECTORY;
    }
}



