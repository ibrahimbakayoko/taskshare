pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'yacine78/taskmanager'
        DOCKER_CREDENTIALS = 'credential-dockerhub'
        SONARQUBE_ENV = 'Sonarqube' // Nom du serveur SonarQube dans Jenkins
        SONARQUBE_TOKEN = credentials('credential-sonarqube')
    }

    stages {
        stage('Cloner le code') {
            steps {
                git branch: 'main', url: 'https://github.com/Yacine781/taskmanager.git'
            }
        }

        stage('Analyse SonarQube') {
            steps {
                withSonarQubeEnv("${SONARQUBE_ENV}") {
                    sh "sonar-scanner -Dsonar.projectKey=taskmanager \
                                      -Dsonar.sources=./backend \
                                      -Dsonar.host.url=$SONAR_HOST_URL \
                                      -Dsonar.login=$SONARQUBE_TOKEN"
                }
            }
        }

        stage('Construire l’image Docker') {
            steps {
                script {
                    sh 'docker build -t $DOCKER_IMAGE:$BUILD_NUMBER -f backend/Dockerfile .'
                }
            }
        }

        stage('Pousser sur Docker Hub') {
            steps {
                script {
                    withDockerRegistry([credentialsId: "$DOCKER_CREDENTIALS", url: ""]) {
                        sh 'docker push $DOCKER_IMAGE:$BUILD_NUMBER'
                    }
                }
            }
        }
    }
}