package com.kinga.utils;

import com.kinga.followtask.config.StorageConfig;
import com.kinga.followtask.entity.PlanningEvent;
import com.kinga.followtask.entity.Project;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.util.StringUtils;

import java.io.File;
import java.io.IOException;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.Random;
import java.util.StringJoiner;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.kinga.followtask.entity.Project.BASE_DIRECTORY;

public class KingaUtils {

    private static final String KEY = "kingaMilay";
    private static final String WORKSPACE = "WORK_SPACE";
    private static final String MEDIA_SPACE = "MEDIA_SPACE";
    public static String dateTimeFormaterPattern = "yyyy-MM-dd'T'HH:mm:ss";
    private static String dateTimeFormaterPattern2 = "yyyy-MM-dd' 'HH:mm:ss";
    public static DateTimeFormatter dateTimeFormater = DateTimeFormatter.ofPattern(dateTimeFormaterPattern);
    @Autowired
    private static StorageConfig storageConfig;
    // Système de substitution : chaque caractère de NORMAL_STRING est encodé vers SUFFLE_STRING
    private static final String SUFFLE_STRING = "tLR4hpeTaQjvGHC0S2zogWPkyq5d3cuMKXlm7FDfiI-BAEJ_Uns/6ZO9YVb1wxrN8@&";
    private static final String NORMAL_STRING = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=";

    public static boolean isValidPhoneNumber(String phoneNumber) {
        if (StringUtils.isEmpty(phoneNumber))
            return true;
        String cleanedPhoneNumber = phoneNumber.replaceAll("\\s+", "").replaceAll("\\+", "");
        String regex = "^(261|0)(32|33|34|38)\\d{2}\\d{3}\\d{2}$";
        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(cleanedPhoneNumber);
        return matcher.matches();
    }

    public static String cleanPhonNumber(String phoneNumber) {
        if (StringUtils.isEmpty(phoneNumber)) {
            return "";
        }
        String cleanedPhoneNumber = phoneNumber.replaceAll("\\s+", "");
        if (cleanedPhoneNumber.length() < 9) {
            throw new RuntimeException("Phone number " + phoneNumber + " is not correct");
        }
        return "0" + (cleanedPhoneNumber.substring(cleanedPhoneNumber.length() - 9));
    }

    public static String separatePhoneNumber(String phoneNumber) {
        if (StringUtils.isEmpty(phoneNumber))
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
        return joiner + "." + new Random().nextInt(1000);
    }

    public static String encodePassword(String password) {
        BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        return passwordEncoder.encode(password);
    }
    public static boolean matchesPassword(CharSequence rawPassword, String encodedPassword) {
        BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        return passwordEncoder.matches(rawPassword,encodedPassword);
    }

    public static String encodeText(String text) {
        if (StringUtils.isEmpty(text))
            return text;
        return encodeTextXor(text);
    }

    public static String decodeText(String text) {
        if (StringUtils.isEmpty(text))
            return text;
        return decodeTextXor(text);
    }

    public static String getDefaultWorkSpaceDirectory() throws IOException {
        String directory = baseDirectory() + File.separator + WORKSPACE;
        File projectDirectory = new File(directory);
        if (!Files.exists(projectDirectory.toPath())) {
            Files.createDirectory(projectDirectory.toPath());
        }
        return directory;
    }

    public static String getDefaultMediaSpaceDirectory() throws IOException {
        String directory = baseDirectory() + File.separator + MEDIA_SPACE;
        File projectDirectory = new File(directory);
        if (!Files.exists(projectDirectory.toPath())) {
            Files.createDirectory(projectDirectory.toPath());
        }
        return directory;
    }

    public static String baseDirectory() throws IOException {
        String rootPath = resolveRootPath();

        String directory = rootPath + File.separator + BASE_DIRECTORY;
        File projectDirectory = new File(directory);

        if (!Files.exists(projectDirectory.toPath())) {
            Files.createDirectories(projectDirectory.toPath());  // createDirectories pour créer les parents aussi
        }

        return directory;
    }
    private static String resolveRootPath() {
        String envPath = System.getenv("APP_STORAGE_BASE_PATH");
        if (envPath != null && !envPath.isBlank()) {
            return envPath;
        }
        String sysProp = System.getProperty("app.storage.base-path");
        if (sysProp != null && !sysProp.isBlank()) {
            return sysProp;
        }
        return System.getProperty("user.home");
    }
    public static String getMacAddress() {
        StringBuilder sb = new StringBuilder();
        try {
            InetAddress ip = InetAddress.getLocalHost();
            System.out.println("Adresse IP : " + ip.getHostAddress());
            NetworkInterface network = NetworkInterface.getByInetAddress(ip);
            byte[] mac = network.getHardwareAddress();
            System.out.print("Adresse MAC : ");
            for (int i = 0; i < mac.length; i++) {
                sb.append(String.format("%02X%s", mac[i], (i < mac.length - 1) ? "-" : ""));
            }
            System.out.println(sb);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return sb.toString();
    }

    /**
     * Encode : XOR sur les bytes, puis Base64, puis substitution de caractères
     */
    public static String encodeTextXor(String input) {
        byte[] data = input.getBytes(StandardCharsets.UTF_8);
        byte[] xored = xor(data);
        String base64 = Base64.getEncoder().encodeToString(xored);
        return substituteEncode(base64);
    }

    /**
     * Decode : substitution inverse, puis Base64, puis XOR
     */
    public static String decodeTextXor(String input) {
        String base64 = substituteDecode(input);
        byte[] data = Base64.getDecoder().decode(base64);
        byte[] result = xor(data);
        return new String(result, StandardCharsets.UTF_8);
    }

    /**
     * Remplace chaque caractère de NORMAL_STRING par son équivalent dans SUFFLE_STRING
     */
    private static String substituteEncode(String input) {
        StringBuilder sb = new StringBuilder();
        for (char c : input.toCharArray()) {
            int idx = NORMAL_STRING.indexOf(c);
            if (idx >= 0 && idx < SUFFLE_STRING.length()) {
                sb.append(SUFFLE_STRING.charAt(idx));
            } else {
                sb.append(c); // caractère non mappé, on le garde tel quel
            }
        }
        return sb.toString();
    }

    /**
     * Opération inverse : remplace chaque caractère de SUFFLE_STRING par son équivalent dans NORMAL_STRING
     */
    private static String substituteDecode(String input) {
        StringBuilder sb = new StringBuilder();
        for (char c : input.toCharArray()) {
            int idx = SUFFLE_STRING.indexOf(c);
            if (idx >= 0 && idx < NORMAL_STRING.length()) {
                sb.append(NORMAL_STRING.charAt(idx));
            } else {
                sb.append(c); // caractère non mappé, on le garde tel quel
            }
        }
        return sb.toString();
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
        // Test encode → decode
        String original = "Andrea_Env";
        String encoded = encodeText(original);
        String encodePassword = encodePassword(original);
        String decoded = decodeText(encoded);

        System.out.println("Original : " + original);
        System.out.println("Encodé   : " + encoded);
        System.out.println("Chifree   : " + encodePassword);
        System.out.println("Décodé   : " + decoded);
        System.out.println("OK       : " + original.equals(decoded));


    }
    public static Duration getOwnElapsedDuration(List<PlanningEvent> events ){
        if (events == null || events.isEmpty()) {
            return Duration.ZERO;
        }
        LocalDateTime now = LocalDateTime.now();
        Duration total = Duration.ZERO;

        for (PlanningEvent event : events) {
            LocalDateTime start = event.getStartTime();
            if (start == null || start.isAfter(now)) {
                // pas encore commencé -> aucune durée écoulée à compter
                continue;
            }

            LocalDateTime end = event.getEndTime();
            LocalDateTime effectiveEnd = (end != null && !end.isAfter(now)) ? end : now;

            total = total.plus(Duration.between(start, effectiveEnd));
        }
        return total;
    }
}