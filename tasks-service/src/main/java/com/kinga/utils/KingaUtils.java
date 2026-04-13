package com.kinga.utils;

import com.kinga.followtask.entity.Project;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.util.StringUtils;

import java.io.File;
import java.io.IOException;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Random;
import java.util.StringJoiner;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.kinga.followtask.entity.Project.BASE_DIRECTORY;

public class KingaUtils {

    private static final String KEY = "kingaMilay";
    private static final String WORKWPACE = "WORK_SPACE";
    private static final String MEDIA_SPACE = "MEDIA_SPACE" ;
    public static String dateTimeFormaterPattern =  "yyyy-MM-dd'T'HH:mm:ss";
    private static String dateTimeFormaterPattern2=  "yyyy-MM-dd' 'HH:mm:ss";
    public static DateTimeFormatter dateTimeFormater =  DateTimeFormatter.ofPattern(dateTimeFormaterPattern);
    private static String SUFFLE_STRING ="tLR4hpeTaQjvGHC0S2zogWPkyq5d3cuMKXlm7FDfiI-BAEJ_Uns/6ZO9YVb1wxrN8@&";
    private static String NORMAL_STRING = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/-_\\=";
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
       return encodeTextXor(text);
    }
    public static String decodeText(String text) {
        return decodeTextXor(text);
    }
    public static String getDefaultWorkSpaceDirectory() throws IOException {
        String directory = baseDirectory ()+File.separator+WORKWPACE;
        File projectDirectory = new File(directory);
        if (!Files.exists(projectDirectory.toPath())) {
            Files.createDirectory(projectDirectory.toPath());
        }
        return directory;
    }
    public static String getDefaultMediaSpaceDirectory() throws IOException {
        String directory = baseDirectory ()+File.separator+MEDIA_SPACE;
        File projectDirectory = new File(directory);
        if (!Files.exists(projectDirectory.toPath())) {
            Files.createDirectory(projectDirectory.toPath());
        }
        return directory;
    }
    public static String baseDirectory() throws IOException {
        String directory = System.getProperty("user.home")+ File.separator+BASE_DIRECTORY;
        File projectDirectory = new File(directory);
        if (!Files.exists(projectDirectory.toPath())) {
            Files.createDirectory(projectDirectory.toPath());
        }
        return directory;
    }
    public static String getMacAddress(){
        StringBuilder sb = new StringBuilder();
        InetAddress ip;
        try {
            ip = InetAddress.getLocalHost();
            System.out.println("Adresse IP : " + ip.getHostAddress());
            NetworkInterface network = NetworkInterface.getByInetAddress(ip);
            byte[] mac = network.getHardwareAddress();
            System.out.print("Adresse MAC : ");
            for (int i = 0; i < mac.length; i++) {
                sb.append(String.format("%02X%s", mac[i], (i < mac.length - 1) ? "-" : ""));
            }
            System.out.println(sb.toString());
        } catch (Exception e) {
            e.printStackTrace();
        }
        return sb.toString();
    }
    public static String encodeTextXor(String input) {
        byte[] data = input.getBytes(StandardCharsets.UTF_8);
        byte[] result = xor(data);
        return Base64.getEncoder().encodeToString(result);
    }

    public static String decodeTextXor(String input) {
        byte[] data = Base64.getDecoder().decode(input);
        byte[] result = xor(data);
        return new String(result, StandardCharsets.UTF_8);
    }

    private static byte[] xor(byte[] data) {
        byte[] keyBytes = KEY.getBytes(StandardCharsets.UTF_8);
        byte[] result = new byte[data.length];

        for (int i = 0; i < data.length; i++) {
            result[i] = (byte) (data[i] ^ keyBytes[i % keyBytes.length]);
        }

        return result;
    }
    public static void main(String[] args) {
        System.out.println(decodeText("@ZO90C0IiI"));
    }
}



