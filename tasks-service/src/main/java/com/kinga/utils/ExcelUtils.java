package com.kinga.utils;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Classe utilitaire pour l'import/export de fichiers Excel via Apache POI.
 *
 * <p>Lecture : {@link #getDatas(String)} / {@link #getDatas(InputStream)}
 * renvoient une Map indexée par nom de feuille, chaque feuille étant une liste
 * de lignes représentées par une Map&lt;nomColonne, valeur&gt; (la 1ère ligne
 * de chaque feuille est considérée comme l'en-tête).</p>
 *
 * <p>Écriture : {@link #writeToFile} / {@link #write} génèrent un fichier .xlsx
 * à partir d'une liste de lignes (Map&lt;String,Object&gt;) et d'un mapping
 * en-tête -&gt; index de colonne (Map&lt;String,Integer&gt;).</p>
 */
public final class ExcelUtils {

    private ExcelUtils() {
    }

    // ------------------------------------------------------------------
    // LECTURE
    // ------------------------------------------------------------------

    /**
     * Lit un fichier Excel à partir de son chemin sur disque.
     *
     * @param fichier chemin absolu ou relatif du fichier .xlsx / .xls
     * @return Map&lt;nomFeuille, List&lt;Map&lt;nomColonne, valeur&gt;&gt;&gt;
     */
    public static Map<String, List<Map<String, Object>>> getDatas(String fichier) throws IOException {
        try (InputStream is = new FileInputStream(fichier)) {
            return getDatas(is);
        }
    }

    /**
     * Lit un fichier Excel à partir d'un flux d'entrée (upload, resource, etc.).
     * Le flux n'est pas fermé par cette méthode si vous devez le réutiliser ;
     * ici il est fermé après lecture pour éviter les fuites.
     *
     * @param inputStream flux du fichier .xlsx / .xls
     * @return Map&lt;nomFeuille, List&lt;Map&lt;nomColonne, valeur&gt;&gt;&gt;
     */
    public static Map<String, List<Map<String, Object>>> getDatas(InputStream inputStream) throws IOException {
        Map<String, List<Map<String, Object>>> result = new LinkedHashMap<>();

        try (Workbook workbook = WorkbookFactory.create(inputStream)) {
            for (Sheet sheet : workbook) {
                result.put(sheet.getSheetName(), extractRows(sheet));
            }
        }
        return result;
    }

    private static List<Map<String, Object>> extractRows(Sheet sheet) {
        List<Map<String, Object>> rows = new ArrayList<>();

        Iterator<Row> rowIterator = sheet.iterator();
        if (!rowIterator.hasNext()) {
            return rows;
        }

        Row headerRow = rowIterator.next();
        List<String> headers = new ArrayList<>();
        for (Cell cell : headerRow) {
            headers.add(getCellValueAsString(cell));
        }

        while (rowIterator.hasNext()) {
            Row row = rowIterator.next();
            if (isRowEmpty(row)) {
                continue;
            }
            Map<String, Object> rowData = new LinkedHashMap<>();
            for (int i = 0; i < headers.size(); i++) {
                Cell cell = row.getCell(i, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                rowData.put(headers.get(i), getCellValue(cell));
            }
            rows.add(rowData);
        }
        return rows;
    }

    private static boolean isRowEmpty(Row row) {
        for (Cell cell : row) {
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                return false;
            }
        }
        return true;
    }

    private static Object getCellValue(Cell cell) {
        if (cell == null) {
            return null;
        }
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue();
                }
                double value = cell.getNumericCellValue();
                if (value == Math.floor(value) && !Double.isInfinite(value)) {
                    return (long) value;
                }
                return value;
            case BOOLEAN:
                return cell.getBooleanCellValue();
            case FORMULA:
                return getFormulaCellValue(cell);
            case BLANK:
            default:
                return null;
        }
    }

    private static Object getFormulaCellValue(Cell cell) {
        try {
            return switch (cell.getCachedFormulaResultType()) {
                case NUMERIC -> cell.getNumericCellValue();
                case STRING -> cell.getStringCellValue();
                case BOOLEAN -> cell.getBooleanCellValue();
                default -> cell.getCellFormula();
            };
        } catch (Exception e) {
            return cell.getCellFormula();
        }
    }

    private static String getCellValueAsString(Cell cell) {
        Object value = getCellValue(cell);
        return value == null ? "" : value.toString();
    }

    // ------------------------------------------------------------------
    // ÉCRITURE
    // ------------------------------------------------------------------

    /**
     * Génère un fichier Excel sur disque.
     *
     * @param datas         lignes à écrire, chaque ligne étant une Map&lt;nomColonne, valeur&gt;
     * @param headers       mapping nomColonne -&gt; index de colonne (0-based)
     * @param fichierSortie chemin du fichier .xlsx à créer
     */
    public static void writeToFile(List<Map<String, Object>> datas,
                                   Map<String, Integer> headers,
                                   String fichierSortie) throws IOException {
        try (OutputStream os = new FileOutputStream(fichierSortie)) {
            write(datas, headers, os);
        }
    }

    /**
     * Génère un fichier Excel directement sur un flux de sortie
     * (ex : téléchargement HTTP via HttpServletResponse.getOutputStream()).
     * Le flux n'est PAS fermé par cette méthode : c'est à l'appelant de le faire
     * (utile pour un flux de réponse HTTP géré par le framework).
     *
     * @param datas         lignes à écrire, chaque ligne étant une Map&lt;nomColonne, valeur&gt;
     * @param headers       mapping nomColonne -&gt; index de colonne (0-based)
     * @param outputStream  flux de sortie cible
     */
    public static void write(List<Map<String, Object>> datas,
                             Map<String, Integer> headers,
                             OutputStream outputStream) throws IOException {
        write(Map.of("Data", new SheetData(headers, datas)), outputStream);
    }

    /**
     * Contenu d'une feuille : le mapping en-tête -&gt; index de colonne, et les
     * lignes. Regroupés parce qu'un classeur à plusieurs feuilles a un jeu de
     * colonnes différent par feuille.
     */
    public record SheetData(Map<String, Integer> headers, List<Map<String, Object>> rows) {
    }

    /**
     * Génère un classeur à plusieurs feuilles sur un flux de sortie.
     *
     * <p>L'ordre des feuilles est celui d'itération de la Map : passer une
     * {@link LinkedHashMap} pour le maîtriser.</p>
     *
     * <p>Le flux n'est PAS fermé : c'est à l'appelant de le faire, typiquement
     * parce qu'il appartient à une réponse HTTP gérée par le framework.</p>
     */
    public static void write(Map<String, SheetData> sheets, OutputStream outputStream) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            CellStyle headerStyle = createHeaderStyle(workbook);

            for (Map.Entry<String, SheetData> entry : sheets.entrySet()) {
                SheetData data = entry.getValue();
                if (data == null) {
                    continue;
                }
                Sheet sheet = workbook.createSheet(safeSheetName(entry.getKey()));

                List<Map.Entry<String, Integer>> sortedHeaders = new ArrayList<>(data.headers().entrySet());
                sortedHeaders.sort(Comparator.comparingInt(Map.Entry::getValue));

                writeHeaderRow(sheet, sortedHeaders, headerStyle);
                writeDataRows(sheet, sortedHeaders, data.rows() == null ? List.of() : data.rows());

                // La ligne d'en-tête reste visible au défilement : un export de
                // plusieurs centaines de lignes se lit sinon à l'aveugle.
                sheet.createFreezePane(0, 1);
                for (Map.Entry<String, Integer> header : sortedHeaders) {
                    sheet.autoSizeColumn(header.getValue());
                }
            }

            workbook.write(outputStream);
            outputStream.flush();
        }
    }

    /**
     * Excel refuse les noms de feuille de plus de 31 caractères et les
     * caractères {@code : \ / ? * [ ]} ; POI lève plutôt que de corriger.
     */
    private static String safeSheetName(String name) {
        String cleaned = (name == null || name.isBlank() ? "Feuille" : name)
                .replaceAll("[:\\\\/?*\\[\\]]", " ")
                .trim();
        return cleaned.length() > 31 ? cleaned.substring(0, 31) : cleaned;
    }

    private static void writeHeaderRow(Sheet sheet,
                                       List<Map.Entry<String, Integer>> sortedHeaders,
                                       CellStyle headerStyle) {
        Row headerRow = sheet.createRow(0);
        for (Map.Entry<String, Integer> entry : sortedHeaders) {
            Cell cell = headerRow.createCell(entry.getValue());
            cell.setCellValue(entry.getKey());
            cell.setCellStyle(headerStyle);
        }
    }

    private static void writeDataRows(Sheet sheet,
                                      List<Map.Entry<String, Integer>> sortedHeaders,
                                      List<Map<String, Object>> datas) {
        int rowIdx = 1;
        for (Map<String, Object> rowData : datas) {
            Row row = sheet.createRow(rowIdx++);
            for (Map.Entry<String, Integer> entry : sortedHeaders) {
                Cell cell = row.createCell(entry.getValue());
                setCellValue(cell, rowData.get(entry.getKey()));
            }
        }
    }

    private static void setCellValue(Cell cell, Object value) {
        if (value == null) {
            cell.setBlank();
        } else if (value instanceof Number number) {
            cell.setCellValue(number.doubleValue());
        } else if (value instanceof Boolean bool) {
            cell.setCellValue(bool);
        } else if (value instanceof LocalDateTime localDateTime) {
            cell.setCellValue(localDateTime);
        } else if (value instanceof LocalDate localDate) {
            cell.setCellValue(localDate);
        } else if (value instanceof Date date) {
            cell.setCellValue(date);
        } else {
            cell.setCellValue(value.toString());
        }
    }

    private static CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }
}