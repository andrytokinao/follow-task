import {Component, ViewChild, AfterViewInit} from "@angular/core";
import {DayPilot, DayPilotCalendarComponent} from "@daypilot/daypilot-lite-angular";
import {forkJoin} from "rxjs";
import {EventsService} from "../../../../../services/events.service";

@Component({
  selector: 'calendar-component-resources',
  template: `<daypilot-calendar [config]="config" #calendar></daypilot-calendar>`,
  styles: [``]
})
export class PlanningResourcesComponent implements AfterViewInit {

  @ViewChild("calendar")
  calendar!: DayPilotCalendarComponent;

  config: DayPilot.CalendarConfig = {
    viewType: "Resources",
    headerHeight: 100,
    startDate: "2025-09-01",
    contextMenu: new DayPilot.Menu({
      items: [
        {
          text: "Edit...",
          onClick: async args => {
            const data = args.source.data;
            const modal = await DayPilot.Modal.prompt("Edit event text:", data.text);

            const calendar = this.calendar.control;
            if (modal.canceled) {
              return;
            }

            data.text = modal.result;
            calendar.events.update(data);
          }
        },
        {
          text: "Delete",
          onClick: args => {
            this.calendar.control.events.remove(args.source);
          }
        }
      ]
    }),
    onTimeRangeSelected: async args => {
      const modal = await DayPilot.Modal.prompt("Create a new event:", "Event 1");

      const calendar = this.calendar.control;
      calendar.clearSelection();
      if (modal.canceled) {
        return;
      }

      calendar.events.add({
        start: args.start,
        end: args.end,
        id: DayPilot.guid(),
        text: modal.result,
        resource: args.resource
      });

    },
    onBeforeHeaderRender: args => {
      const data = args.column.data;
      const header = args.header;
      header.verticalAlignment = "top";
      if (data.tags.image) {
        args.header.areas = [
          {
            left: "calc(50% - 30px)",
            bottom: 10,
            height: 60,
            width: 60,
            image: data.tags.image,
            style: "border-radius: 40px; overflow: hidden; border: 3px solid #fff;"
          }
        ];
      }
    },
    onBeforeEventRender: args => {
      args.data.areas = [
        {
          top: 3,
          right: 3,
          width: 24,
          height: 24,
          action: "ContextMenu",
          padding: 2,
          symbol: "/icons/daypilot.svg#threedots-h",
          cssClass: "event-menu",
          toolTip: "Menu"
        }
      ];
    }
  };

  constructor(private ds: EventsService) {
  }

  ngAfterViewInit(): void {

    const from = new DayPilot.Date(this.config.startDate);
    const to = from.addDays(1);

    forkJoin([
      this.ds.getResources(),
      this.ds.getEvents(from, to)
    ]).subscribe(data => {
      const options = {
        columns: data[0],
        events: data[1]
      };
      this.calendar.control.update(options);
    });

  }

}

