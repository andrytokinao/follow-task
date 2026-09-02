import {Injectable} from '@angular/core';

/** Valeurs qu'une cellule sait porter. `null`/`undefined` laissent la case vide. */
export type XlsxCell = string | number | Date | boolean | null | undefined;

export interface XlsxColumn {
  header: string;
  /** Largeur en « caractères » Excel. 12 par défaut. */
  width?: number;
}

export interface XlsxSheet {
  name: string;
  columns: XlsxColumn[];
  rows: XlsxCell[][];
}

/**
 * Écriture de classeurs .xlsx sans dépendance.
 *
 * Un .xlsx est une archive ZIP de fichiers XML. Le générateur ci-dessous écrit
 * les cinq parties minimales attendues par Excel et assemble le ZIP en mode
 * « stocké » (pas de compression) : cela évite d'embarquer un algorithme de
 * compression pour des tableaux qui tiennent en quelques dizaines de kilo-octets.
 *
 * Ce qui est géré : plusieurs feuilles, en-tête figé et filtre automatique,
 * largeurs de colonnes, et le typage des cellules (texte, nombre, date, booléen)
 * pour qu'Excel trie et calcule sans reformatage manuel.
 */
@Injectable({providedIn: 'root'})
export class XlsxExportService {

  /** Styles déclarés dans styles.xml, référencés par leur index. */
  private static readonly STYLE_DEFAULT = 0;
  private static readonly STYLE_HEADER = 1;
  private static readonly STYLE_DATE = 2;

  /** Excel compte les jours depuis le 30/12/1899 (le décalage de 1900 inclus). */
  private static readonly EPOCH = Date.UTC(1899, 11, 30);

  download(fileName: string, sheets: XlsxSheet | XlsxSheet[]): void {
    const blob = this.build(Array.isArray(sheets) ? sheets : [sheets]);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.toLowerCase().endsWith('.xlsx') ? fileName : fileName + '.xlsx';
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Révoquer tout de suite couperait le téléchargement dans Firefox.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  build(sheets: XlsxSheet[]): Blob {
    if (!sheets.length) {
      throw new Error('Un classeur doit contenir au moins une feuille.');
    }
    const names = this.uniqueNames(sheets);
    const files: { path: string, content: string }[] = [
      {path: '[Content_Types].xml', content: this.contentTypes(sheets.length)},
      {path: '_rels/.rels', content: this.rootRels()},
      {path: 'xl/workbook.xml', content: this.workbook(names)},
      {path: 'xl/_rels/workbook.xml.rels', content: this.workbookRels(sheets.length)},
      {path: 'xl/styles.xml', content: this.styles()},
      ...sheets.map((sheet, index) => ({
        path: `xl/worksheets/sheet${index + 1}.xml`,
        content: this.worksheet(sheet)
      }))
    ];

    return new Blob([this.zip(files)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }

  // =======================================================================
  // Parties XML
  // =======================================================================

  private contentTypes(sheetCount: number): string {
    const sheetParts = this.range(sheetCount)
      .map(i => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
      .join('');
    return this.declaration() +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      sheetParts +
      '</Types>';
  }

  private rootRels(): string {
    return this.declaration() +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>';
  }

  private workbook(names: string[]): string {
    const sheets = names
      .map((name, index) => `<sheet name="${this.escape(name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`)
      .join('');
    return this.declaration() +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"' +
      ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      `<sheets>${sheets}</sheets></workbook>`;
  }

  private workbookRels(sheetCount: number): string {
    const sheetRels = this.range(sheetCount)
      .map(i => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
      .join('');
    // Les styles prennent l'identifiant qui suit la dernière feuille.
    return this.declaration() +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      sheetRels +
      `<Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
      '</Relationships>';
  }

  /** Trois styles seulement : normal, en-tête (blanc sur bleu), date. */
  private styles(): string {
    return this.declaration() +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts>' +
      '<fonts count="2">' +
      '<font><sz val="11"/><name val="Calibri"/></font>' +
      '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>' +
      '</fonts>' +
      // Les deux premiers remplissages sont imposés par le format.
      '<fills count="3">' +
      '<fill><patternFill patternType="none"/></fill>' +
      '<fill><patternFill patternType="gray125"/></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FF2563EB"/><bgColor indexed="64"/></patternFill></fill>' +
      '</fills>' +
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="3">' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>' +
      '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
      '</cellXfs>' +
      '</styleSheet>';
  }

  private worksheet(sheet: XlsxSheet): string {
    const lastColumn = this.columnName(Math.max(sheet.columns.length, 1) - 1);
    const lastRow = sheet.rows.length + 1;

    const cols = sheet.columns.length
      ? '<cols>' + sheet.columns
        .map((column, index) => `<col min="${index + 1}" max="${index + 1}" width="${column.width ?? 12}" customWidth="1"/>`)
        .join('') + '</cols>'
      : '';

    const header = '<row r="1">' + sheet.columns
      .map((column, index) => this.cell(index, 1, column.header, XlsxExportService.STYLE_HEADER))
      .join('') + '</row>';

    const body = sheet.rows.map((row, rowIndex) => {
      const number = rowIndex + 2;
      const cells = row
        .map((value, columnIndex) => this.cell(columnIndex, number, value))
        .join('');
      return `<row r="${number}">${cells}</row>`;
    }).join('');

    return this.declaration() +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      // Ligne d'en-tête figée : sur un export de plusieurs centaines de lignes,
      // c'est la seule façon de garder les intitulés visibles au défilement.
      '<sheetViews><sheetView workbookViewId="0">' +
      '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' +
      '</sheetView></sheetViews>' +
      cols +
      `<sheetData>${header}${body}</sheetData>` +
      `<autoFilter ref="A1:${lastColumn}${lastRow}"/>` +
      '</worksheet>';
  }

  private cell(columnIndex: number, rowNumber: number, value: XlsxCell, style?: number): string {
    const ref = this.columnName(columnIndex) + rowNumber;
    const styleAttr = style ? ` s="${style}"` : '';

    if (value === null || value === undefined || value === '') {
      return style ? `<c r="${ref}"${styleAttr}/>` : '';
    }
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        return '';
      }
      return `<c r="${ref}" s="${XlsxExportService.STYLE_DATE}"><v>${this.toSerial(value)}</v></c>`;
    }
    if (typeof value === 'number') {
      return isFinite(value) ? `<c r="${ref}"${styleAttr}><v>${value}</v></c>` : '';
    }
    if (typeof value === 'boolean') {
      return `<c r="${ref}"${styleAttr} t="b"><v>${value ? 1 : 0}</v></c>`;
    }
    // Chaîne en clair : évite d'avoir à maintenir une table sharedStrings.
    return `<c r="${ref}"${styleAttr} t="inlineStr"><is><t xml:space="preserve">${this.escape(String(value))}</t></is></c>`;
  }

  /** Jours depuis l'origine Excel, calculés sur la date locale affichée. */
  private toSerial(date: Date): number {
    const local = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(),
      date.getHours(), date.getMinutes(), date.getSeconds());
    return Math.round(((local - XlsxExportService.EPOCH) / 86_400_000) * 100_000) / 100_000;
  }

  private columnName(index: number): string {
    let name = '';
    let n = index;
    do {
      name = String.fromCharCode(65 + (n % 26)) + name;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return name;
  }

  /** Excel refuse les doublons, les noms vides, > 31 caractères et []:*?/\ */
  private uniqueNames(sheets: XlsxSheet[]): string[] {
    const used = new Set<string>();
    return sheets.map((sheet, index) => {
      let base = (sheet.name || `Feuille${index + 1}`).replace(/[\[\]:*?\/\\]/g, ' ').trim().slice(0, 31);
      if (!base) {
        base = `Feuille${index + 1}`;
      }
      let name = base;
      let suffix = 2;
      while (used.has(name.toLowerCase())) {
        const tail = ` (${suffix++})`;
        name = base.slice(0, 31 - tail.length) + tail;
      }
      used.add(name.toLowerCase());
      return name;
    });
  }

  private declaration(): string {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  }

  private escape(value: string): string {
    return value
      // Les caractères de contrôle rendent le fichier illisible par Excel.
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private range(count: number): number[] {
    return Array.from({length: count}, (_, i) => i);
  }

  // =======================================================================
  // Archive ZIP (méthode « stocké »)
  // =======================================================================

  private zip(files: { path: string, content: string }[]): Uint8Array {
    const encoder = new TextEncoder();
    const entries = files.map(file => ({
      name: encoder.encode(file.path),
      data: encoder.encode(file.content)
    }));

    const {date, time} = this.dosDateTime(new Date());
    const locals: Uint8Array[] = [];
    const centrals: Uint8Array[] = [];
    let offset = 0;

    for (const entry of entries) {
      const crc = this.crc32(entry.data);
      const size = entry.data.length;

      const local = new Uint8Array(30 + entry.name.length + size);
      const localView = new DataView(local.buffer);
      localView.setUint32(0, 0x04034b50, true);   // signature
      localView.setUint16(4, 20, true);           // version minimale
      localView.setUint16(6, 0, true);            // drapeaux
      localView.setUint16(8, 0, true);            // méthode : stocké
      localView.setUint16(10, time, true);
      localView.setUint16(12, date, true);
      localView.setUint32(14, crc, true);
      localView.setUint32(18, size, true);        // taille compressée
      localView.setUint32(22, size, true);        // taille réelle
      localView.setUint16(26, entry.name.length, true);
      localView.setUint16(28, 0, true);           // pas de champ « extra »
      local.set(entry.name, 30);
      local.set(entry.data, 30 + entry.name.length);
      locals.push(local);

      const central = new Uint8Array(46 + entry.name.length);
      const centralView = new DataView(central.buffer);
      centralView.setUint32(0, 0x02014b50, true);
      centralView.setUint16(4, 20, true);         // version d'écriture
      centralView.setUint16(6, 20, true);         // version minimale
      centralView.setUint16(8, 0, true);
      centralView.setUint16(10, 0, true);
      centralView.setUint16(12, time, true);
      centralView.setUint16(14, date, true);
      centralView.setUint32(16, crc, true);
      centralView.setUint32(20, size, true);
      centralView.setUint32(24, size, true);
      centralView.setUint16(28, entry.name.length, true);
      centralView.setUint32(42, offset, true);    // position de l'en-tête local
      central.set(entry.name, 46);
      centrals.push(central);

      offset += local.length;
    }

    const centralSize = centrals.reduce((total, part) => total + part.length, 0);
    const end = new Uint8Array(22);
    const endView = new DataView(end.buffer);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(8, entries.length, true);
    endView.setUint16(10, entries.length, true);
    endView.setUint32(12, centralSize, true);
    endView.setUint32(16, offset, true);

    return this.concat([...locals, ...centrals, end]);
  }

  private concat(parts: Uint8Array[]): Uint8Array {
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const result = new Uint8Array(total);
    let position = 0;
    for (const part of parts) {
      result.set(part, position);
      position += part.length;
    }
    return result;
  }

  private dosDateTime(now: Date): { date: number, time: number } {
    return {
      date: ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate(),
      time: (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2)
    };
  }

  private static crcTable?: Uint32Array;

  private crc32(data: Uint8Array): number {
    if (!XlsxExportService.crcTable) {
      const table = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let value = i;
        for (let bit = 0; bit < 8; bit++) {
          value = value & 1 ? 0xEDB88320 ^ (value >>> 1) : value >>> 1;
        }
        table[i] = value >>> 0;
      }
      XlsxExportService.crcTable = table;
    }
    const table = XlsxExportService.crcTable;
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
      crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
}
