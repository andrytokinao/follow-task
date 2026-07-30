package com.kinga.followtask.service;

import com.kinga.followtask.entity.Canall;
import com.kinga.followtask.repository.CanalContactRepository;
import com.kinga.followtask.repository.CanalWatcherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CanalAccessService {

    private final CanalWatcherRepository canalWatcherRepository;
    private final CanalContactRepository canalContactRepository;

    public boolean canView(Long canallId, String userAppId) {
        // 1. Accès accordé manuellement (le cas qui vous intéresse)
        if (canalWatcherRepository.existsByCanallIdAndUserAppId(canallId, userAppId)) {
            return true;
        }
        // 2. Participant réel dont le contact est résolu vers ce UserApp
        return canalContactRepository.existsByCanallIdAndContactUserAppId(canallId, userAppId);
    }

    public void grantAccess(Canall canall, com.kinga.followtask.entity.UserApp user, com.kinga.followtask.entity.UserApp grantedBy, String reason) {
        if (canalWatcherRepository.existsByCanallIdAndUserAppId(canall.getId(), user.getId())) {
            return;
        }
        var watcher = new com.kinga.followtask.entity.CanalWatcher();
        watcher.setCanall(canall);
        watcher.setUserApp(user);
        watcher.setGrantedBy(grantedBy);
        watcher.setReason(reason);
        canalWatcherRepository.save(watcher);
    }

    public void revokeAccess(Long canallId, String userAppId) {
        canalWatcherRepository.deleteByCanallIdAndUserAppId(canallId, userAppId);
    }
}