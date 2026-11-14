# Builds and runs the Kaboom backend on an online host (Railway, Render ...).
# Settings come from the host's environment variables, not from this file:
#   APP_CORS_ALLOWEDORIGINS  the address of the website, e.g. https://kaboom.vercel.app
#   APP_FRONTENDURL          the same address (used in password-reset e-mails)
#   SPRING_DATASOURCE_URL    jdbc:h2:file:/data/kaboom  (/data must be a permanent volume)
#   SPRING_MAIL_*            optional, for password-reset e-mails

# 1) build the jar
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B -DskipTests package

# 2) run it
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/kaboom-backend-1.0.0.jar app.jar
# Keeps memory use small enough for a small online server.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
