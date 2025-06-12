import oshi.SystemInfo;
import oshi.hardware.HardwareAbstractionLayer;
import oshi.hardware.NetworkIF;
import java.util.List;

public class OshiTest {
    public static void main(String[] args) {
        SystemInfo si = new SystemInfo();
        HardwareAbstractionLayer hal = si.getHardware();
        List<NetworkIF> networkIFs = hal.getNetworkIFs();

        if (networkIFs.isEmpty()) {
            System.out.println("No network interfaces found.");
            return;
        }

        for (NetworkIF netIF : networkIFs) {
            System.out.println("Interface: " + netIF.getDisplayName());
            // These are the methods you said were missing:
          /*  byte[] mac = netIF.getHardwareAddress(); // Should work
            boolean isUp = netIF.isUp();             // Should work
            boolean isVirtual = netIF.isVirtual();   // Should work
            boolean isLoopback = netIF.isLoopback(); // Should work

            System.out.println("  MAC: " + (mac != null ? bytesToHex(mac) : "N/A"));
            System.out.println("  Up: " + isUp);
            System.out.println("  Virtual: " + isVirtual);
            System.out.println("  Loopback: " + isLoopback);
            System.out.println("---");*/
        }
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X", b));
        }
        return sb.toString();
    }
}
