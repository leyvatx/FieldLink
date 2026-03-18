pipeline {
  agent any
  options { timestamps() }
  triggers { githubPush() }

  stages {
    stage('Deploy') {
      steps {
        sh 'sudo /usr/local/bin/fieldlink-deploy.sh'
      }
    }
    stage('Smoke test') {
      steps {
        sh 'curl -fsS https://fieldlinkapp.com/ >/dev/null'
      }
    }
  }
}