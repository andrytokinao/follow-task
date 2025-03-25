import { Component } from '@angular/core';
import {Router} from "@angular/router";

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
  start(){
    this.router.navigate(["public/login"]);
  }
  scrollToFeatures() {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
