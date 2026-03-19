pipeline {
  agent any
  options { timestamps() }
  triggers { githubPush() }

  stages {
    stage('Preflight') {
      steps {
        sh '''
          set -euxo pipefail
          command -v sudo
          test -x /usr/local/bin/fieldlink-deploy.sh
        '''
      }
    }
    stage('Deploy') {
      steps {
        sh '''
          set -euxo pipefail
          sudo -n /usr/local/bin/fieldlink-deploy.sh
        '''
      }
    }
    stage('Smoke test') {
      steps {
        sh '''
          set -euxo pipefail
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