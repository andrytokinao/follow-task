import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CustomField, CustomFieldValue, DisplayCustomField} from "../../../type/issue";
import {MatCheckbox, MatCheckboxChange} from "@angular/material/checkbox";
import {FormsModule} from "@angular/forms";
import {IssueService} from "../../../services/issue.service";
import {NgForOf, NgIf} from "@angular/common";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatOption} from "@angular/material/autocomplete";
import {MatSelect} from "@angular/material/select";

@Component({
  selector: 'app-multi-select-field',
  standalone: true,
  imports: [
    MatCheckbox,
    FormsModule,
    NgForOf,
    MatFormField,
    MatLabel,
    MatOption,
    MatSelect,
    NgIf
  ],
  templateUrl: './multi-select-field.component.html',
  styleUrl: './multi-select-field.component.css'
})
export class MultiSelectFieldComponent implements DisplayCustomField{
  @Output() edit = new EventEmitter<any>();
  @Output() save = new EventEmitter<any>();
  @Input() isEditable = false;
  @Input() isEditing = false;
  customFieldValue: CustomFieldValue ;
  string :'';
  public value:any = {};
  private customField: CustomField;
  protected options: String[];
  protected values: String[];
  selectedOption: String;
  constructor(private issueService :IssueService
  ) {
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.edit.emit(this.customFieldValue);
    } else {
      this.save.emit(this.customFieldValue);
    }
  }
  saveValue(){
    let value:CustomFieldValue ={
      date: '',
      string:'',
      id:this.customFieldValue.id,
      issue:this.customFieldValue.issue,
      numeric:0,
      user:undefined,
      customField:this.customFieldValue.customField,
      text:'',
      values:this.values
    };
    this.save.emit(value);

  }
  setCustomFieldValue(value: CustomFieldValue) {
    this.customFieldValue = value;
    this.values = value.values;
    this.selectedOption = this.value.string;
    this.getCustomField();

  }
  getCustomField() {
    this.issueService.getCustomField(this.customFieldValue.customField.id).subscribe(res => {
      this.customField = res;
      this.options = this.customField.options;
    })
  }

  isSelected(option) {
    if( this.values == null)
      return false;
    return this.values.some(s => s == option);
  }

  onCheckboxChange(event: any, option: String) {
    if (this.values == null) {
      this.values = [];
    }
    this.values = JSON.parse(JSON.stringify(this.values));
    if (event.checked) {
      this.values.push(option);
    } else {
      this.values = this.values.filter(v => v != option)
    }
  }
  colors = [
    'rgba(106,124,143,0.43)', // Bleu Marine
    'rgba(229,105,116,0.75)', // Gris Anthracite
    '#7C0A1D', // Rouge Bordeaux
    '#228B22', // Vert Forêt
    '#F5F5DC', // Beige Sable
    '#1C1C1C', // Noir Charbon
    '#87CEEB', // Bleu Ciel
    '#98FF98', // Vert Menthe
    '#FFDB58', // Jaune Moutarde
    '#CC5500', // Orange Brûlé
    '#D3D3D3', // Gris Clair
    '#4682B4', // Bleu Acier
    '#D70000', // Rouge Cerise
    '#6A0FAD', // Violet Profond
    '#40E0D0', // Turquoise
    '#E6E6FA', // Mauve Doux
    '#7B3F00', // Brun Chocolat
    '#FFDAB9', // Pêche
    '#704214', // Sépia
    '#C0C0C0'  // Argent Métallique
  ];

    partiallyComplete() {
    return undefined;
  }

  getRandomColor(option:String) {
    const indexNonTrouve :number = this.options.indexOf(option);
    return this.colors[indexNonTrouve];
  }
}
