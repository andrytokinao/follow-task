import { Component } from '@angular/core';
import {Router} from "@angular/router";
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import {MatMenuTrigger} from "@angular/material/menu";

@Component({
  standalone:false,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  constructor(
    private router: Router,
  ) {
  }
  features = [
   /* {
      icon: 'build',
      title: 'Automatisation Avancée',
      description: 'Simplifiez vos tâches avec nos outils d\'automatisation intelligents.',
    },*/
    {
      icon: 'security',
      title: 'Sécurité Renforcée',
      description: 'Protégez vos données grâce à notre infrastructure hautement sécurisée.',
    },
   {
      icon: 'speed',
      title: 'Performance Optimale',
      description: 'Des solutions rapides et fiables pour maximiser votre productivité.',
    },
  ];
  nom = '';
  email = '';
  start(){
    this.router.navigate(["/login"]);
  }
  scrollToFeatures() {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  onSubmit() {

  }
  selectedValue = '';

  select(value: string, trigger: MatMenuTrigger) {
    this.selectedValue = value;
    trigger.closeMenu();
  }

  save(form: any) {
    console.log('Formulaire soumis:', form.value, 'Option:', this.selectedValue);

  }
}
