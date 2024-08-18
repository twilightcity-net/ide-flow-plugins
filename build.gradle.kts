plugins {
    id("java")
    id("groovy")
    id("org.jetbrains.intellij") version "1.17.3"
}

group = "net.twilightcity"
version = "1.0-SNAPSHOT"

repositories {
    mavenLocal()
    mavenCentral()
    maven {
        url = uri("http://nexus.twilightcity.net:8081/repository/public")
        isAllowInsecureProtocol = true
    }
}

dependencies {
    implementation("net.twilightcity:gridtime-rest-client:${project.properties["gridtime.version"]}")
    compileOnly("org.projectlombok:lombok:1.18.2")

//    testImplementation("net.twilightcity:gridtime-rest-client-test:${project.properties["gridtime.version"]}")

    testImplementation("org.slf4j:slf4j-api:2.0.16")
    testImplementation("com.google.guava:guava:33.3.0-jre")
    testImplementation("org.reflections:reflections:0.10.2")
    testImplementation("cglib:cglib-nodep:3.2.0")
    testImplementation("org.objenesis:objenesis:1.3")
    testImplementation("org.codehaus.groovy:groovy-all:3.0.13")
    testImplementation("org.spockframework:spock-spring:2.4-M4-groovy-3.0") {
        exclude(group = "org.codehaus.groovy")
    }
    testImplementation("org.springframework.boot:spring-boot-starter-test:3.3.2")
}

// Configure Gradle IntelliJ Plugin
// Read more: https://plugins.jetbrains.com/docs/intellij/tools-gradle-intellij-plugin.html
intellij {
    version.set("2023.2.6")
    type.set("IC") // Target IDE Platform

    plugins.set(listOf(/* Plugin Dependencies */))
}

tasks {
    // Set the JVM compatibility versions
    withType<JavaCompile> {
        sourceCompatibility = "17"
        targetCompatibility = "17"
    }

    withType<Test>().configureEach {
        useJUnitPlatform()
    }

    patchPluginXml {
        sinceBuild.set("232")
        untilBuild.set("242.*")
    }

    signPlugin {
        certificateChain.set(System.getenv("CERTIFICATE_CHAIN"))
        privateKey.set(System.getenv("PRIVATE_KEY"))
        password.set(System.getenv("PRIVATE_KEY_PASSWORD"))
    }

    publishPlugin {
        token.set(System.getenv("PUBLISH_TOKEN"))
    }
}
