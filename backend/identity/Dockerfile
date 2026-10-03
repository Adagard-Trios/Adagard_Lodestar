# Keycloak with Lodestar's sign-in extension (extension/): the designed sign-in screens post to the token endpoint
# and the "lodestar direct grant" flow checks phone + SMS code, staff ID + PIN, or email + password + 2-step.
# Build context: backend/identity.
FROM maven:3.9-eclipse-temurin-21 AS extension
WORKDIR /src
COPY extension/pom.xml .
RUN mvn -q -B dependency:go-offline
COPY extension/src ./src
RUN mvn -q -B package

FROM quay.io/keycloak/keycloak:26.0
COPY --from=extension /src/target/lodestar-keycloak-signin.jar /opt/keycloak/providers/
# Build-time options the stack runs with (Postgres, health, /auth); `start` re-augments only if they differ.
ENV KC_DB=postgres KC_HEALTH_ENABLED=true KC_HTTP_RELATIVE_PATH=/auth
RUN /opt/keycloak/bin/kc.sh build
