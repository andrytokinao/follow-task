package com.kinga.followtask.service;

import com.kinga.followtask.dto.ExportRequestDTO;
import com.kinga.followtask.dto.IssuePlanningSummary;
import com.kinga.followtask.entity.CustomField;
import com.kinga.followtask.entity.CustomFieldValue;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.IssueLabels;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.repository.IssueRepository;
import com.kinga.utils.ExcelUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.io.IOException;
import java.io.OutputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Export Excel des demandes.
 *
 * Le classeur est fabriqué ici et non dans le navigateur : le serveur seul a
 * accès aux heures d'exécution, qui se calculent à partir de tous les
 * événements de planning de la demande et de ses sous-tâches.
 *
 * Deux feuilles :
 * <ul>
 *   <li><b>Demandes</b> — une ligne par demande exportée, colonnes au choix du
 *       client, dont les heures d'exécution ;</li>
 *   <li><b>Sous-tâches</b> — une ligne par sous-tâche, avec son avancement.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class ExportService {

    private final IssueRepository issueRepository;
    private final IssueService issueService;

    private static final String SHEET_SUBTASKS = "Sous-tâches";

    /** Une colonne exportable : son intitulé et la façon d'en lire la valeur. */
    private record Column(String key, String header, Function<Row, Object> read) {
    }

    /**
     * Demande accompagnée de ses heures : le résumé de planning coûte une
     * agrégation, on ne le calcule qu'une fois par demande.
     */
    private record Row(Issue issue, IssuePlanningSummary summary) {
    }

    // ------------------------------------------------------------------
    // Colonnes de la feuille principale
    // ------------------------------------------------------------------

    private static final List<Column> COLUMNS = List.of(
            new Column("key", "Clé", r -> r.issue().getIssueKey()),
            new Column("summary", "Titre", r -> r.issue().getSummary()),
            new Column("type", "Type", r -> r.issue().getIssueType() == null ? null : r.issue().getIssueType().getName()),
            new Column("status", "Statut", r -> r.issue().getStatus() == null ? null : r.issue().getStatus().getDisplayName()),
            new Column("assignee", "Assigné", r -> userNames(r.issue())),
            new Column("labels", "Tags", r -> labels(r.issue())),
            new Column("progress", "Avancement (%)", r -> r.issue().getCurrentCompletionPercent()),
            new Column("created", "Créée le", r -> r.issue().getCreationDate()),
            new Column("updated", "Mise à jour", r -> r.issue().getUpdateDate()),
            new Column("reporter", "Rapporteur", r -> fullName(r.issue().getReporter())),
            new Column("children", "Sous-tâches", r -> countChildren(r.issue())),
            new Column("description", "Description", r -> plainText(r.issue().getDescription())),
            // Heures d'exécution : agrégées sur la demande ET ses sous-tâches.
            new Column("hoursTotal", "Heures planifiées", r -> hours(minutes(r.summary(), Kind.TOTAL))),
            new Column("hoursSpent", "Heures réalisées", r -> hours(minutes(r.summary(), Kind.SPENT))),
            new Column("hoursRemaining", "Heures restantes", r -> hours(minutes(r.summary(), Kind.REMAINING)))
    );

    private enum Kind {TOTAL, SPENT, REMAINING}

    // ------------------------------------------------------------------
    // Génération
    // ------------------------------------------------------------------

    /** Colonnes proposables au client, pour que l'IHM n'ait pas à les redéclarer. */
    public List<Map<String, String>> availableColumns() {
        return COLUMNS.stream()
                .map(column -> Map.of("key", column.key(), "label", column.header()))
                .collect(Collectors.toList());
    }

    /**
     * Écrit le classeur sur le flux fourni. Le flux n'est pas fermé ici : il
     * appartient à la réponse HTTP.
     */
    @Transactional(readOnly = true)
    public void export(ExportRequestDTO request, OutputStream outputStream) throws IOException {
        List<Row> rows = loadRows(request);

        Map<String, ExcelUtils.SheetData> sheets = new LinkedHashMap<>();
        sheets.put(sheetName(request), mainSheet(request, rows));

        // Par défaut on joint les sous-tâches : c'est là que se lit l'avancement
        // réel d'une demande.
        if (!Boolean.FALSE.equals(request.getIncludeSubtasks())) {
            sheets.put(SHEET_SUBTASKS, subtaskSheet(rows));
        }

        ExcelUtils.write(sheets, outputStream);
    }

    private String sheetName(ExportRequestDTO request) {
        String name = request.getSheetName();
        return (name == null || name.isBlank()) ? "Demandes" : name;
    }

    private List<Row> loadRows(ExportRequestDTO request) {
        if (request == null || CollectionUtils.isEmpty(request.getIssueIds())) {
            return List.of();
        }
        // findAllById ne garantit pas l'ordre demandé : on réordonne sur les
        // identifiants reçus, qui portent le tri affiché à l'écran.
        Map<Long, Issue> byId = issueRepository.findAllById(request.getIssueIds()).stream()
                .collect(Collectors.toMap(Issue::getId, Function.identity(), (a, b) -> a));

        List<Row> rows = new ArrayList<>();
        for (Long id : request.getIssueIds()) {
            Issue issue = byId.get(id);
            if (issue == null) {
                continue;
            }
            rows.add(new Row(issue, planningSummary(id)));
        }
        return rows;
    }

    /** Une demande sans événement de planning ne doit pas faire échouer l'export. */
    private IssuePlanningSummary planningSummary(Long issueId) {
        try {
            return issueService.getIssuePlanningSummary(issueId);
        } catch (Exception e) {
            return null;
        }
    }

    // ------------------------------------------------------------------
    // Feuille principale
    // ------------------------------------------------------------------

    private ExcelUtils.SheetData mainSheet(ExportRequestDTO request, List<Row> rows) {
        List<Column> selected = selectColumns(request.getColumns());
        List<CustomField> customFields = selectedCustomFields(request.getColumns(), rows);

        Map<String, Integer> headers = new LinkedHashMap<>();
        int index = 0;
        for (Column column : selected) {
            headers.put(column.header(), index++);
        }
        for (CustomField field : customFields) {
            // Un champ personnalisé homonyme d'une colonne standard écraserait
            // la clé : on suffixe plutôt que de perdre une colonne.
            headers.put(uniqueHeader(headers, field.getName()), index++);
        }

        List<String> customHeaders = new ArrayList<>(headers.keySet())
                .subList(selected.size(), headers.size());

        List<Map<String, Object>> data = new ArrayList<>();
        for (Row row : rows) {
            Map<String, Object> line = new LinkedHashMap<>();
            for (Column column : selected) {
                line.put(column.header(), column.read().apply(row));
            }
            for (int i = 0; i < customFields.size(); i++) {
                line.put(customHeaders.get(i), customValue(row.issue(), customFields.get(i)));
            }
            data.add(line);
        }
        return new ExcelUtils.SheetData(headers, data);
    }

    /** Les clés inconnues sont ignorées ; aucune clé demandée = tout. */
    private List<Column> selectColumns(List<String> keys) {
        if (CollectionUtils.isEmpty(keys)) {
            return COLUMNS;
        }
        Map<String, Column> byKey = COLUMNS.stream()
                .collect(Collectors.toMap(Column::key, Function.identity()));
        List<Column> selected = keys.stream()
                .map(byKey::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        return selected.isEmpty() ? COLUMNS : selected;
    }

    /**
     * Champs personnalisés demandés, sous la forme {@code cf-<id>}. Ils sont
     * lus sur les demandes exportées : un champ retiré du projet mais encore
     * porté par une demande reste ainsi exportable.
     */
    private List<CustomField> selectedCustomFields(List<String> keys, List<Row> rows) {
        if (CollectionUtils.isEmpty(keys)) {
            return List.of();
        }
        List<Long> wanted = keys.stream()
                .filter(key -> key != null && key.startsWith("cf-"))
                .map(key -> parseId(key.substring(3)))
                .filter(Objects::nonNull)
                .toList();
        if (wanted.isEmpty()) {
            return List.of();
        }
        Map<Long, CustomField> found = new LinkedHashMap<>();
        for (Row row : rows) {
            for (CustomFieldValue value : safe(row.issue().getValues())) {
                CustomField field = value == null ? null : value.getCustomField();
                if (field != null && field.getId() != null && wanted.contains(field.getId())) {
                    found.putIfAbsent(field.getId(), field);
                }
            }
        }
        return wanted.stream().map(found::get).filter(Objects::nonNull).toList();
    }

    private Object customValue(Issue issue, CustomField field) {
        CustomFieldValue value = safe(issue.getValues()).stream()
                .filter(candidate -> candidate != null
                        && candidate.getCustomField() != null
                        && Objects.equals(candidate.getCustomField().getId(), field.getId()))
                .findFirst()
                .orElse(null);
        if (value == null) {
            return null;
        }
        String type = field.getType() == null ? "" : field.getType();
        return switch (type) {
            case "Number" -> value.getNumeric();
            case "Date" -> value.getDate();
            case "User" -> fullName(value.getUser());
            case "CheckBox" -> CollectionUtils.isEmpty(value.getValues())
                    ? null : String.join(", ", value.getValues());
            // String, Link et Selection écrivent tous dans `string`.
            default -> value.getString() != null ? value.getString() : value.getText();
        };
    }

    // ------------------------------------------------------------------
    // Feuille des sous-tâches
    // ------------------------------------------------------------------

    private ExcelUtils.SheetData subtaskSheet(List<Row> rows) {
        Map<String, Integer> headers = new LinkedHashMap<>();
        headers.put("Demande", 0);
        headers.put("Sous-tâche", 1);
        headers.put("Titre", 2);
        headers.put("Type", 3);
        headers.put("Statut", 4);
        headers.put("Assigné", 5);
        headers.put("Avancement (%)", 6);
        headers.put("Heures planifiées", 7);
        headers.put("Heures réalisées", 8);
        headers.put("Heures restantes", 9);
        headers.put("Créée le", 10);

        List<Map<String, Object>> data = new ArrayList<>();
        for (Row row : rows) {
            List<Issue> children = new ArrayList<>(safe(row.issue().getChildren()));
            children.sort(Comparator.comparing(Issue::getIssueKey,
                    Comparator.nullsLast(Comparator.naturalOrder())));

            for (Issue child : children) {
                IssuePlanningSummary childSummary = planningSummary(child.getId());
                Map<String, Object> line = new LinkedHashMap<>();
                line.put("Demande", row.issue().getIssueKey());
                line.put("Sous-tâche", child.getIssueKey());
                line.put("Titre", child.getSummary());
                line.put("Type", child.getIssueType() == null ? null : child.getIssueType().getName());
                line.put("Statut", child.getStatus() == null ? null : child.getStatus().getDisplayName());
                line.put("Assigné", userNames(child));
                line.put("Avancement (%)", child.getCurrentCompletionPercent());
                line.put("Heures planifiées", hours(minutes(childSummary, Kind.TOTAL)));
                line.put("Heures réalisées", hours(minutes(childSummary, Kind.SPENT)));
                line.put("Heures restantes", hours(minutes(childSummary, Kind.REMAINING)));
                line.put("Créée le", child.getCreationDate());
                data.add(line);
            }
        }
        return new ExcelUtils.SheetData(headers, data);
    }

    // ------------------------------------------------------------------
    // Lecture des valeurs
    // ------------------------------------------------------------------

    private static Integer minutes(IssuePlanningSummary summary, Kind kind) {
        if (summary == null) {
            return null;
        }
        return switch (kind) {
            case TOTAL -> summary.getTotalMinutes();
            case SPENT -> summary.getSpentMinutes();
            case REMAINING -> summary.getRemainingMinutes();
        };
    }

    /** Des heures décimales plutôt que des minutes : c'est l'unité sur laquelle
     *  les tableurs font des sommes lisibles. Arrondi au centième d'heure. */
    private static Double hours(Integer minutes) {
        if (minutes == null) {
            return null;
        }
        return Math.round(minutes / 60d * 100d) / 100d;
    }

    private static String userNames(Issue issue) {
        List<String> names = safe(issue.getAssignes()).stream()
                .map(ExportService::fullName)
                .filter(Objects::nonNull)
                .toList();
        if (!names.isEmpty()) {
            return String.join(", ", names);
        }
        // Repli sur l'assignation historique, encore renseignée sur les
        // demandes antérieures aux adhésions multiples.
        return fullName(issue.getAssigne());
    }

    private static String fullName(UserApp user) {
        if (user == null) {
            return null;
        }
        String full = ((user.getFirstName() == null ? "" : user.getFirstName()) + " "
                + (user.getLastName() == null ? "" : user.getLastName())).trim();
        return full.isEmpty() ? user.getUsername() : full;
    }

    private static String labels(Issue issue) {
        List<String> names = safe(issue.getLabels()).stream()
                .map(IssueLabels::getLabel)
                .filter(Objects::nonNull)
                .map(label -> label.getName())
                .filter(Objects::nonNull)
                .toList();
        return names.isEmpty() ? null : String.join(", ", names);
    }

    private static Integer countChildren(Issue issue) {
        return safe(issue.getChildren()).size();
    }

    /** Les descriptions sont saisies en HTML : illisibles telles quelles dans
     *  une cellule. */
    private static String plainText(String html) {
        if (html == null || html.isBlank()) {
            return null;
        }
        String text = html
                .replaceAll("(?i)<br\\s*/?>", " ")
                .replaceAll("(?i)</(p|div|li|h[1-6])>", " ")
                .replaceAll("<[^>]*>", "")
                .replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replaceAll("\\s+", " ")
                .trim();
        return text.isEmpty() ? null : text;
    }

    private static String uniqueHeader(Map<String, Integer> headers, String name) {
        String base = (name == null || name.isBlank()) ? "Champ" : name;
        String candidate = base;
        int suffix = 2;
        while (headers.containsKey(candidate)) {
            candidate = base + " (" + suffix++ + ")";
        }
        return candidate;
    }

    private static Long parseId(String raw) {
        try {
            return Long.valueOf(raw);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static <T> List<T> safe(List<T> list) {
        return list == null ? List.of() : list;
    }

    /** Horodatage du fichier : le moment où l'export a été exécuté. */
    public LocalDateTime executedAt() {
        return LocalDateTime.now();
    }
}
