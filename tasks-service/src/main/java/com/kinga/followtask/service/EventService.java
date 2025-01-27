package com.kinga.followtask.service;

import com.kinga.followtask.dto.EventSearchCriteriaDTO;
import com.kinga.followtask.entity.*;
import com.kinga.followtask.repository.*;
import com.kinga.followtask.repository.criteria.IssueSearchCriteria;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.sql.Timestamp;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

import static graphql.Assert.assertNotNull;

@Service
@RequiredArgsConstructor
public class EventService {
  final  EventRepository eventRepository;
  final EventTypeRepository eventTypeRepository;
  final UserService userService;
  final IssueRepository issueRepository;
  final IssueService issueService;
  final ValueDaoRepository valueDaoRepository;


  public Event saveEvent(Event event){
    if ("CUSTOM_FIELD".equalsIgnoreCase(event.getEventType().getName())) {
       CustomFieldValue value = event.getDateValue();
       if (value != null) {
         String start = event.getStart();
         DateFormat dateFormat = new SimpleDateFormat(Event.dateTimeFormaterPattern);
           try {
               Date dateValue =  dateFormat.parse(start);
               value.setDate(dateValue);
               valueDaoRepository.save(value);
           } catch (ParseException e) {
               throw new RuntimeException(e);
           }
       }
    }
    if (event.getUser() == null){
      event.setUser(userService.getConnected());
    }
      return eventRepository.save(event);
  }
  public List<Event> searchEvents(EventSearchCriteriaDTO criteria){
      List<Event> events = new ArrayList<>();
      List<Event> eventsFields = new ArrayList<>();
    if (!CollectionUtils.isEmpty(criteria.getCustomFieldIds())) {
        eventsFields = builddFromDateValue(criteria);

    }
    if (CollectionUtils.isEmpty(criteria.getParrentIds())) {
      events = eventRepository.findEventsByUserIdsAndIssues(criteria.getUserIds(), criteria.getIssueIds(), criteria.getStart(), criteria.getEnd(),criteria.getProjectId());
      events = events.stream()
              .filter(event -> !(event.getEventType().getName().equalsIgnoreCase("CUSTOM_FIELD")))
              .collect(Collectors.toCollection(ArrayList::new));
      if (!CollectionUtils.isEmpty(eventsFields)) {
          events.addAll(eventsFields);
      }
      return events;
    }
    List<Long> issueIds = criteria.getIssueIds();
    if (issueIds == null) {
      issueIds = new ArrayList<>();
      issueIds.addAll(criteria.getParrentIds());
      criteria.setIssueIds(issueIds);
    }
    events = eventRepository.findEventsByUserIdsAndIssuesAndParent(criteria.getUserIds(), criteria.getIssueIds(), criteria.getParrentIds(), criteria.getStart(), criteria.getEnd(),criteria.getProjectId());
      if (!CollectionUtils.isEmpty(eventsFields)) {
          events.addAll(eventsFields);
      }
      return events;
  }
  public List<Event> builddFromDateValue(EventSearchCriteriaDTO eCriteria) {
    Long projectId = eCriteria.getProjectId();
    LocalDateTime start = eCriteria.getStart();
    LocalDateTime end = eCriteria.getEnd();
    List<Event> events = new ArrayList<>();
    IssueSearchCriteria iCriteria = new IssueSearchCriteria();
    iCriteria.setProjectId(projectId);

    List<Long> cfIds = eCriteria.getCustomFieldIds();
    for (Long cfId: eCriteria.getCustomFieldIds()) {
      Map<Long, Date> froms = new HashMap<>();
      Map<Long, Date> tos = new HashMap<>();
      tos.put(cfId,Date.from(end.toInstant(ZoneOffset.UTC)));
      froms.put(cfId,Date.from(start.toInstant(ZoneOffset.UTC)));
      iCriteria.setCustomFieldDateValueFrom(froms);
      iCriteria.setCustomFieldDateValueTo(tos);
      List<Issue> issues = issueService.searchIssues(iCriteria);
      if (CollectionUtils.isEmpty(issues)) {
        continue;
      }

      for (Issue issue : issues ) {
        for (CustomFieldValue value :issue.getValues()) {
          if (cfId  != value.getCustomField().getId()) {
            continue;
          }
          if (!(value instanceof DateCustomFieldValue)) {
            continue;
          }
          DateCustomFieldValue dateValue = (DateCustomFieldValue) value;
          events.add(generateByValue(dateValue,issue));
        }
      }
    }
    return events;
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
  private Event generateByValue(CustomFieldValue value, Issue issue) {
    Event existing = eventRepository.findByDateValueId(value.getId());
    if (existing != null) {
      return existing;
    }
    if (!(value instanceof DateCustomFieldValue)) {
      return null;
    }
    if (issue == null) {
      issue = value.getIssue();
    }
    DateCustomFieldValue dateValue = (DateCustomFieldValue) value;
    Date date = dateValue.getDate();
    LocalDateTime localDateTime = ((Timestamp) date).toLocalDateTime();
    Event event = new Event();
    event.setAllDay(true);

    event.setEventType(eventTypeByName("CUSTOM_FIELD"));
    int hours = localDateTime.getHour() == 0? 8 : 0;
    event.setStart(localDateTime.plusHours(hours));
    event.setEnd(localDateTime.plusHours(hours+1));
    event.setUser(userService.getAnonymeUser());
    event.setTitle(value.getIssue().getIssueKey()+"CF:"+value.getCustomField().getName() +" ");
    event.setIssue(value.getIssue());
    event.setDateValue(dateValue);

    return saveEvent(event);

  }
  public EventType eventTypeByName(String eventName) {
    EventType eventType = eventTypeRepository.getByName(eventName);
    if (eventType != null) {
      return eventType;
    }
    eventType = new EventType();
    eventType.setName(eventName);
    return eventTypeRepository.save(eventType);
  }
}
