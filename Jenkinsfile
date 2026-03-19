pipeline {
  agent any
  options { timestamps() }
  triggers { githubPush() }

  stages {
    stage('Preflight') {
      steps {
    sh '''
      set -eu
      command -v sudo
      sudo -n -l /usr/local/bin/fieldlink-deploy.sh >/dev/null
    '''
  }
    }
    stage('Deploy') {
      steps {
        sh '''
          set -eux
          sudo -n /usr/local/bin/fieldlink-deploy.sh
        '''
      }
    }
    stage('Smoke test') {
      steps {
        sh '''
          set -eux
          for i in 1 2 3 4 5; do
            if curl -fsS --max-time 10 https://fieldlinkapp.com/ >/dev/null; then
              exit 0
            fi
            sleep 5
          done
          exit 1
        '''
      }
    }
  }
}