package com.kinga.followtask.web;

import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.repository.UserRepository;
import com.kinga.followtask.service.AvatarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Distribution des avatars.
 *
 * <p>Deux façons de les obtenir, pour deux besoins :</p>
 * <ul>
 *   <li>{@code /api/avatars} rend les images encodées en {@code data:}. Le
 *       client les pose directement dans le HTML : un tableau de quarante
 *       demandes n'ouvre plus quarante connexions, et les images survivent à
 *       l'export d'une page ou à sa mise en PDF, qui n'emportent pas de
 *       session.</li>
 *   <li>{@code /api/avatars/{id}/image} sert l'image en binaire, pour les
 *       usages où une URL reste plus simple qu'une chaîne de plusieurs
 *       kilo-octets.</li>
 * </ul>
 *
 * <p>{@code /api/avatars/versions} existe pour que le client n'ait à demander
 * que ce qui a changé : la liste des versions pèse quelques centaines d'octets,
 * les images qu'elle décrit plusieurs centaines de kilo-octets.</p>
 */
@RestController
@RequestMapping("/api/avatars")
@RequiredArgsConstructor
public class AvatarController {

    /** Une vignette ne change que si son propriétaire remplace sa photo, et
     *  l'URL porte alors une version différente : le navigateur peut la garder
     *  longtemps sans risquer d'afficher une image périmée. */
    private static final Duration DUREE_CACHE = Duration.ofDays(30);

    private final AvatarService avatarService;
    private final UserRepository userRepository;

    /**
     * Version de l'avatar de chaque utilisateur. Le client compare avec ce
     * qu'il a en réserve et ne redemande que la différence.
     */
    @GetMapping("/versions")
    public Map<String, String> versions() {
        return avatarService.versions(userRepository.findAll());
    }

    /**
     * Avatars encodés en {@code data:}, indexés par identifiant d'utilisateur.
     *
     * @param ids utilisateurs voulus ; tous si l'argument est absent. Le client
     *            précise en général une liste : il ne redemande que ce que sa
     *            réserve locale ne contient pas encore.
     */
    @GetMapping
    public Map<String, String> avatars(@RequestParam(required = false) List<String> ids) {
        List<UserApp> users = (ids == null || ids.isEmpty())
                ? userRepository.findAll()
                : userRepository.findAllById(ids);
        return avatarService.dataUris(users);
    }

    /**
     * L'avatar en binaire.
     *
     * <p>L'{@code ETag} évite de renvoyer l'image à un client qui l'a déjà, et
     * {@code Cache-Control} lui évite même de poser la question. L'appelant est
     * censé faire figurer la version dans l'URL — en paramètre {@code v},
     * ignoré ici — pour que le remplacement d'une photo produise une adresse
     * nouvelle plutôt que d'attendre l'expiration.</p>
     */
    @GetMapping(value = "/{userId}/image", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> image(@PathVariable String userId,
                                        @RequestHeader(value = HttpHeaders.IF_NONE_MATCH, required = false)
                                        String versionDetenue) {
        UserApp user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        String etag = "\"" + avatarService.version(user) + "\"";
        if (etag.equals(versionDetenue)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED).eTag(etag).build();
        }
        byte[] octets = avatarService.octets(user);
        if (octets == null || octets.length == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .eTag(etag)
                .cacheControl(CacheControl.maxAge(DUREE_CACHE).cachePublic())
                .contentType(MediaType.parseMediaType(avatarService.typeMime(user)))
                .contentLength(octets.length)
                .body(octets);
    }
}
