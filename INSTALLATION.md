# 📦 Guide d'Installation

> Guide complet d'installation et de configuration de l'application selon votre environnement.

---

## 📋 Prérequis Généraux

| Outil | Version minimale | Remarque |
|-------|-----------------|----------|
| Java (JDK) | 17+ | OpenJDK ou Oracle JDK |
| Maven | 3.8+ | Ou Gradle 7+ |
| Base de données | PostgreSQL 14+ / MySQL 8+ | Selon configuration |

---

## 🪟 Windows

### 1. Installer Java (JDK 17+)

Télécharger et installer depuis [https://adoptium.net](https://adoptium.net).

Vérifier l'installation :

```cmd
java -version
```

### 2. Installer Maven

Télécharger depuis [https://maven.apache.org/download.cgi](https://maven.apache.org/download.cgi), puis ajouter au `PATH` :

```cmd
set PATH=%PATH%;C:\apache-maven-3.9.0\bin
mvn -version
```

### 3. Configurer le répertoire de stockage

Par défaut, les fichiers sont stockés dans `C:\Users\<VotreNom>\kinga-files`.

Pour personnaliser, ajouter dans `application.properties` :

```properties
app.storage.base-path=C:/storage/monapp
```

Ou via variable d'environnement (dans les variables système Windows) :

```cmd
setx APP_STORAGE_BASE_PATH "C:\storage\monapp"
```

### 4. Lancer l'application

```cmd
mvn spring-boot:run
```

Ou avec un JAR compilé :

```cmd
java -jar target/monapp.jar
```

### 5. Lancer avec un répertoire personnalisé (en ligne de commande)

```cmd
java -Dapp.storage.base-path="C:\var\storage" -jar target/monapp.jar
```

---

## 🐧 Linux

### 1. Installer Java (JDK 17+)

**Debian / Ubuntu :**

```bash
sudo apt update
sudo apt install openjdk-17-jdk -y
java -version
```

**CentOS / RHEL / Fedora :**

```bash
sudo dnf install java-17-openjdk-devel -y
java -version
```

### 2. Installer Maven

```bash
sudo apt install maven -y   # Debian/Ubuntu
# ou
sudo dnf install maven -y   # CentOS/Fedora

mvn -version
```

### 3. Configurer le répertoire de stockage

Créer le répertoire et donner les droits à l'application :

```bash
sudo mkdir -p /var/storage/monapp
sudo chown -R $USER:$USER /var/storage/monapp
```

Configurer dans `application.properties` :

```properties
app.storage.base-path=/var/storage/monapp
```

Ou via variable d'environnement (dans `~/.bashrc` ou `~/.profile`) :

```bash
export APP_STORAGE_BASE_PATH=/var/storage/monapp
source ~/.bashrc
```

### 4. Lancer l'application

```bash
mvn spring-boot:run
```

Ou en production avec le JAR :

```bash
java -jar target/monapp.jar
```

### 5. Lancer en arrière-plan (service systemd)

Créer le fichier service :

```bash
sudo nano /etc/systemd/system/monapp.service
```

Contenu du fichier :

```ini
[Unit]
Description=Mon Application Spring Boot
After=network.target

[Service]
User=monuser
ExecStart=/usr/bin/java -jar /opt/monapp/monapp.jar
Environment=APP_STORAGE_BASE_PATH=/var/storage/monapp
SuccessExitStatus=143
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Activer et démarrer :

```bash
sudo systemctl daemon-reload
sudo systemctl enable monapp
sudo systemctl start monapp
sudo systemctl status monapp
```

---

## 🍎 macOS

### 1. Installer Homebrew (si pas déjà installé)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Installer Java (JDK 17+)

```bash
brew install openjdk@17

# Ajouter au PATH (dans ~/.zshrc ou ~/.bash_profile)
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

java -version
```

### 3. Installer Maven

```bash
brew install maven
mvn -version
```

### 4. Configurer le répertoire de stockage

```bash
mkdir -p ~/storage/monapp
```

Configurer dans `application.properties` :

```properties
app.storage.base-path=/Users/<VotreNom>/storage/monapp
```

Ou via variable d'environnement (dans `~/.zshrc`) :

```bash
export APP_STORAGE_BASE_PATH=~/storage/monapp
source ~/.zshrc
```

### 5. Lancer l'application

```bash
mvn spring-boot:run

# Ou avec le JAR :
java -jar target/monapp.jar
```

### 6. Lancer en arrière-plan (LaunchAgent)

Créer le fichier `~/Library/LaunchAgents/com.monapp.plist` :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.monapp</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/java</string>
    <string>-jar</string>
    <string>/opt/monapp/monapp.jar</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>APP_STORAGE_BASE_PATH</key>
    <string>/Users/monuser/storage/monapp</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
</dict>
</plist>
```

Charger le service :

```bash
launchctl load ~/Library/LaunchAgents/com.monapp.plist
```

---

## 🐳 Docker

### 1. Prérequis

Installer Docker Desktop : [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)

```bash
docker --version
docker compose version
```

### 2. Dockerfile

```dockerfile
FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

COPY target/monapp.jar app.jar

# Créer le répertoire de stockage dans le conteneur
RUN mkdir -p /var/storage/monapp

# Variable d'environnement par défaut (surchargeable)
ENV APP_STORAGE_BASE_PATH=/var/storage/monapp

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 3. Construire l'image

```bash
# Compiler d'abord le projet
mvn clean package -DskipTests

# Construire l'image Docker
docker build -t monapp:latest .
```

### 4. Lancer le conteneur

```bash
docker run -d \
  --name monapp \
  -p 8080:8080 \
  -e APP_STORAGE_BASE_PATH=/var/storage/monapp \
  -v /chemin/local/storage:/var/storage/monapp \
  monapp:latest
```

> ⚠️ Le volume `-v` est important pour **persister les fichiers** entre les redémarrages du conteneur.

### 5. Docker Compose (recommandé)

Créer un fichier `docker-compose.yml` :

```yaml
version: '3.8'

services:
  app:
    build: tasks-service
    container_name: monapp
    ports:
      - "8080:8080"
    environment:
      - APP_STORAGE_BASE_PATH=/var/storage/monapp
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/monapp
      - SPRING_DATASOURCE_USERNAME=monuser
      - SPRING_DATASOURCE_PASSWORD=monpassword
    volumes:
      - storage_data:/var/storage/monapp
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    container_name: monapp-db
    environment:
      - POSTGRES_DB=monapp
      - POSTGRES_USER=monuser
      - POSTGRES_PASSWORD=monpassword
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: [ "CMD-SHELL", "pg_isready -U monuser -d monapp" ]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  storage_data:
  db_data:
```

Démarrer les services :

```bash
# Démarrer (en arrière-plan)
docker compose up -d

# Voir les logs
docker compose logs -f app

# Arrêter
docker compose down

# Arrêter et supprimer les volumes
docker compose down -v
```

### 6. Commandes Docker utiles

```bash
# Voir les conteneurs actifs
docker ps

# Accéder au shell du conteneur
docker exec -it monapp sh

# Voir les logs en temps réel
docker logs -f monapp

# Redémarrer le conteneur
docker restart monapp
```

---

## ⚙️ Récapitulatif de la configuration du stockage

| Méthode | Exemple | Priorité |
|---------|---------|----------|
| Variable d'environnement | `APP_STORAGE_BASE_PATH=/var/storage` | 🥇 Haute |
| Propriété système | `-Dapp.storage.base-path=/var/storage` | 🥈 Moyenne |
| `application.properties` | `app.storage.base-path=/var/storage` | 🥉 Défaut |
| Par défaut (code) | `~/kinga-files` | Fallback |

---

## 🆘 Problèmes fréquents

### Port 8080 déjà utilisé

```bash
# Linux/macOS - Trouver le processus
lsof -i :8080
kill -9 <PID>

# Ou changer le port dans application.properties
server.port=9090
```

### Permissions refusées sur le répertoire de stockage

```bash
# Linux/macOS
sudo chown -R $USER:$USER /var/storage/monapp
chmod 755 /var/storage/monapp
```

### Fichier dupliqué non numéroté correctement

Vérifier que le répertoire cible est bien accessible en lecture par l'application (droits `r+w`).

---

*Pour toute question, ouvrir une issue sur le dépôt du projet.*
