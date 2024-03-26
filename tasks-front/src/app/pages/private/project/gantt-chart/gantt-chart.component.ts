import { Component } from '@angular/core';
import { CdkDragMove, CdkDragEnd } from '@angular/cdk/drag-drop';

interface Task {
  name: string;
  startDate: Date;
  endDate: Date;
}

@Component({
  selector: 'app-gantt-chart',
  templateUrl: './gantt-chart.component.html',
  styleUrls: ['./gantt-chart.component.css']
})
export class GanttChartComponent {
  tasks: Task[] = [
    { name: 'Task 1', startDate: new Date(2022, 1, 1), endDate: new Date(2022, 1, 5) },
    { name: 'Task 2', startDate: new Date(2022, 1, 6), endDate: new Date(2022, 1, 10) },
    { name: 'Task 3', startDate: new Date(2022, 1, 11), endDate: new Date(2022, 1, 15) }
  ];

  onTaskDrag(event: CdkDragMove, task: Task): void {
    const deltaX = event.pointerPosition.x - (event.event as MouseEvent).clientX;
    task.startDate.setDate(task.startDate.getDate() - Math.round(deltaX / 20));
    task.endDate.setDate(task.endDate.getDate() - Math.round(deltaX / 20));
  }

  onTaskDragEnd(event: any, task: Task): void {
    console.log('Fin du déplacement');
  }
  calculateTaskWidth(task: Task): string {
    const totalDays = Math.ceil((task.endDate.getTime() - task.startDate.getTime())*7 / (1000 * 3600 * 24));
    return totalDays * 40 + 'px';
  }
  days: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
}


