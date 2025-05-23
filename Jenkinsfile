pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'yacine78/taskmanager'
        DOCKER_CREDENTIALS = 'credential-dockerhub'
        SONARQUBE_ENV = 'Sonarqube'
        SONARQUBE_TOKEN = credentials('credential-sonarqube')
        SONAR_HOST_URL = 'http://192.168.27.66:9000/'
    }

    stages {
        stage('Cloner le code') {
            steps {
                git branch: 'main', url: 'https://github.com/Yacine781/taskmanager.git'
            }
        }

        stage('Tests & couverture') {
            steps {
                dir('backend') {
                    sh 'npm install'
                    sh 'npx mocha ./test/basic.test.js --reporter mocha-junit-reporter --reporter-options mochaFile=./test-results/results.xml'
                    sh 'npx nyc report --reporter=text-lcov > coverage.lcov'
                }
            }
        }

        stage('Analyse SonarQube') {
            steps {
                withSonarQubeEnv("${SONARQUBE_ENV}") {
                    sh """
                        sonar-scanner \
                        -Dsonar.projectKey=taskmanager \
                        -Dsonar.sources=./backend \
                        -Dsonar.javascript.lcov.reportPaths=./backend/coverage.lcov \
                        -Dsonar.host.url=$SONAR_HOST_URL \
                        -Dsonar.login=$SONARQUBE_TOKEN
                    """
                }
            }
        }

        stage('Construire l’image Docker') {
            steps {
                script {
                    sh """
                        docker build -t $DOCKER_IMAGE:$BUILD_NUMBER -t $DOCKER_IMAGE:latest backend/
                    """
                }
            }
        }

        stage('Pousser sur Docker Hub') {
            steps {
                script {
                    withDockerRegistry([credentialsId: "$DOCKER_CREDENTIALS", url: ""]) {
                        sh """
                            docker push $DOCKER_IMAGE:$BUILD_NUMBER
                            docker push $DOCKER_IMAGE:latest
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                junit 'backend/test-results/results.xml'
            }
        }
    }
}
