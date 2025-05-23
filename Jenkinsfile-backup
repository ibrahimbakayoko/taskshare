pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'yacine78/taskmanager'
        DOCKER_CREDENTIALS = 'credential-dockerhub'
        // KUBE_CONFIG = '/root/.kube/config' // Chemin vers ton fichier kubeconfig
    }

    stages {
        stage('Cloner le code') {
            steps {
                git branch: 'main', url: 'https://github.com/Yacine781/taskmanager.git'
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

        // stage('Déployer sur Kubernetes') {
        //     steps {
        //         script {
        //             sh 'kubectl apply -f k8s/deployment.yaml'
        //             sh 'kubectl apply -f k8s/service.yaml'
        //         }
        //     }
        // ici}
    }
}
