FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

COPY . .

# Build the app
RUN chmod +x mvnw && ./mvnw clean package -DskipTests

# Copy the built jar to a predictable filename (no wildcard at runtime)
RUN cp target/*.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
