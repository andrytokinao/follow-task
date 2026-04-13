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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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
  private static final int DEFAULT_DURATION_MINUTES = 30;
  private static final LocalTime DAY_START = LocalTime.of(8, 0);
  private static final LocalTime DAY_END   = LocalTime.of(20, 0);

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
  public Event nextEvent(EventSearchCriteriaDTO criteria){
    List<Event> existings = searchEvents(criteria);
    Event proposition = new Event();
    LocalDateTime[] times = proposeNextEvent(existings);
    proposition.setStart(times[0]);
    proposition.setEnd(times[1]);
    return proposition;
  }
  /**
   * Propose le prochain créneau libre à partir de maintenant.
   * Si aucun créneau disponible aujourd'hui, cherche le lendemain, et ainsi de suite.
   *
   * @param events  liste de tous les événements existants
   * @return        un tableau [start, end] représentant le créneau proposé
   */

  public static LocalDateTime[] proposeNextEvent(List<Event> events) {
    return proposeNextEvent(events, DEFAULT_DURATION_MINUTES);
  }
  public static LocalDateTime[] proposeNextEvent(List<Event> events, int durationMinutes) {
    // Point de départ : maintenant, arrondi au prochain multiple de 30 min
    LocalDateTime candidate = roundUpToNext30(LocalDateTime.now());

    // Sécurité : ne pas chercher au-delà de 30 jours
    LocalDateTime limit = LocalDateTime.now().plusDays(30);

    while (candidate.isBefore(limit)) {

      // Si on dépasse la fin de journée, on passe au lendemain à 08:00
      if (candidate.toLocalTime().isAfter(DAY_END.minusMinutes(durationMinutes))) {
        candidate = LocalDateTime.of(candidate.toLocalDate().plusDays(1), DAY_START);
        continue;
      }

      LocalDateTime candidateEnd = candidate.plusMinutes(durationMinutes);

      // Récupérer les events du même jour, triés par heure de début
      LocalDate day = candidate.toLocalDate();
      List<Event> dayEvents = events.stream()
              .filter(e -> e.getStart() != null && e.getEnd() != null)
              .filter(e -> parseDate(e.getStart()).toLocalDate().equals(day))
              .sorted(Comparator.comparing(e -> parseDate(e.getStart())))
              .toList();

      // Chercher une collision
      LocalDateTime finalCandidate = candidate;
      Event collision = dayEvents.stream()
              .filter(e -> overlaps(finalCandidate, candidateEnd,
                      parseDate(e.getStart()), parseDate(e.getEnd())))
              .findFirst()
              .orElse(null);

      if (collision == null) {
        // Créneau libre trouvé !
        return new LocalDateTime[]{ candidate, candidateEnd };
      } else {
        // Décaler après la fin de l'événement en collision
        candidate = parseDate(collision.getEnd());
        candidate = roundUpToNext30(candidate);
      }
    }

    // Cas improbable : aucun créneau trouvé dans les 30 jours
    throw new IllegalStateException("Aucun créneau libre trouvé dans les 30 prochains jours.");
  }
  /** Vérifie si [s1, e1[ chevauche [s2, e2[ */
  private static boolean overlaps(LocalDateTime s1, LocalDateTime e1,
                                  LocalDateTime s2, LocalDateTime e2) {
    return s1.isBefore(e2) && e1.isAfter(s2);
  }
  /** Arrondit au prochain multiple de 30 minutes (ex: 10h17 → 10h30) */
  private static LocalDateTime roundUpToNext30(LocalDateTime dt) {
    int minute = dt.getMinute();
    int remainder = minute % 30;
    if (remainder == 0 && dt.getSecond() == 0 && dt.getNano() == 0) {
      return dt;
    }
    return dt.plusMinutes(30 - remainder)
            .withSecond(0)
            .withNano(0);
  }
  /**
   * Parse la String retournée par Event.getStart() / Event.getEnd()
   * en utilisant le formatter défini dans l'entity.
   */
  private static LocalDateTime parseDate(String dateStr) {
    return LocalDateTime.parse(dateStr, Event.dateTimeFormater);
  }
}
