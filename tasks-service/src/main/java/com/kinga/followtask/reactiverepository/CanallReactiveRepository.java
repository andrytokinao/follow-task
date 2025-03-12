package com.kinga.followtask.reactiverepository;

import com.kinga.followtask.r2dbc.entity.Canall;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.List;
public interface CanallReactiveRepository  extends ReactiveCrudRepository<Canall, Long>{
    @Query(value = "SELECT c.* FROM canall c " +
            "JOIN canall_member cm ON c.id = cm.canall_id " +
            "WHERE cm.user_id = :userId")
    Flux<Canall> findByUserId(String userId);
}
