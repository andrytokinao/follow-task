package com.kinga.followtask.service;

import com.kinga.followtask.lincense.entity.LicenseInfo;
import com.kinga.followtask.lincense.repository.LicendeRepository;
import com.kinga.utils.ComputerIdentifier;
import com.kinga.utils.MachineInfo;
import com.nimbusds.jose.shaded.gson.Gson;
import org.springframework.stereotype.Service;

import java.net.SocketException;
import java.time.LocalDate;
import java.util.Optional;

import static com.kinga.utils.ComputerIdentifier.machineInfo;
@Service
public class LicenseService {
    LicendeRepository licenseRepository;

    public static void main(String[] args) throws SocketException {
        Gson gson = new Gson();
        System.out.println(gson.toJson(machineInfo));
    }

    public boolean validateLicenseOnStartup() {
        Optional<LicenseInfo> licenseOpt = licenseRepository.findTopByOrderByIdDesc();

        if (licenseOpt.isEmpty()) {
            System.err.println("❌ Aucune licence locale trouvée !");
            // Demande d'initialisation
            return false;
        }

        LicenseInfo license = licenseOpt.get();

        // 🧩 À compléter : Récupération des informations machine (empreinte unique)

        // Vérification de piratage
        if (!machineInfo.equals(licenseOpt.get().getLicenseKey())) {
            System.err.println(" Empreinte machine invalide. Tentative de piratage détectée !");
            return false;
        }

        //  Vérification de statut distant (si connecté à Internet)
        if (isOnline()) {
            try {
                // 🧩 À compléter : Appel REST vers serveur central pour vérifier la licence à jour
                LicenseInfo remoteLicense = verifyLicenseRemotely(license.getLicenseKey(), machineInfo.getSystemUUID());
                if (remoteLicense != null) {
                    license = remoteLicense;
                    licenseRepository.save(license); // Mise à jour locale
                } else {
                    System.err.println("❌ Licence non trouvée sur le serveur distant.");
                    return false;
                }
            } catch (Exception e) {
                System.err.println("🔌 Erreur lors de la vérification distante : " + e.getMessage());
                // On continue en local uniquement
            }
        }

        //  Vérification de date
        if (license.getEndDate() != null && license.getEndDate().isBefore(LocalDate.now())) {
            license.setStatus(LicenseInfo.LicenseStatus.EXPIRED);
            licenseRepository.save(license);
            System.err.println("⏳ Licence expirée.");
            return false;
        }

        // ❌ Vérification du statut
        if (license.getStatus() == LicenseInfo.LicenseStatus.REVOKED || license.getStatus() == LicenseInfo.LicenseStatus.SUSPENDED) {
            System.err.println(" Licence révoquée ou suspendue.");
            return false;
        }

        System.out.println("✅ Licence valide pour cette machine.");
        return true;
    }

    private boolean isOnline() {
        return false;
    }

    private LicenseInfo verifyLicenseRemotely(String licenseKey, String fingerprint) {
        // 🧩 Exemple de structure (à toi de compléter avec RestTemplate ou WebClient)
        // POST https://monserveur.com/api/licenses/verify
        // Body JSON : { licenseKey: "XXXX", fingerprint: "abc123" }

    /*
    Exemple avec RestTemplate :
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    Map<String, String> body = Map.of("licenseKey", licenseKey, "fingerprint", fingerprint);
    HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);
    ResponseEntity<LicenseInfo> response = restTemplate.postForEntity(...);
    return response.getBody();
    */

        return null; //  Remplace avec ton code
    }
}
