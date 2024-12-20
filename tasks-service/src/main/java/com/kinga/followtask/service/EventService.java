package com.kinga.followtask.service;

import com.kinga.followtask.dto.EventSearchCriteriaDTO;
import com.kinga.followtask.entity.Event;
import com.kinga.followtask.entity.EventType;
import com.kinga.followtask.repository.EventRepository;
import com.kinga.followtask.repository.EventTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {
  final  EventRepository eventRepository;
  final EventTypeRepository eventTypeRepository;
  final UserService userService;
  public Event saveEvent(Event event){
    if (event.getUser() == null){
      event.setUser(userService.getConnected());
    }
      return eventRepository.save(event);
  }
  public List<Event> searchEvents(EventSearchCriteriaDTO criteria){
    List<Event> res = eventRepository.findEventsByUserIdsAndIssues(criteria.getUserIds(), criteria.getIssueIds(), criteria.getStart(), criteria.getEnd());
   return res;
  }
  public List<EventType> allEventType(){
      return eventTypeRepository.findAll();
  }

    public Event deleteEvent(Long eventId) {
       this.eventRepository.deleteById(eventId);
       return null;
    }

    public Event getByEventId(Long eventId) {
      return eventRepository.findById(eventId).orElse(null);
    }
}
