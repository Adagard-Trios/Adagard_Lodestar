// Waypoint Lodestar · main pipeline (PLATFORM.md §7).
// Reference only, not on the live path (GitHub Actions: .github/workflows/deploy-demo.yml). This pipeline would run on `main`:
//   unit suites -> compose stack + Playwright -> SonarQube gate -> images (Trivy, push, cosign)
//   -> terraform plan/apply (dev, manual approval) -> GitOps tag bump in deploy/k8s/overlays/dev -> Argo CD syncs.
//
// Agent requirements: Linux, Docker Engine with the compose v2 plugin, git, curl. Plugins: Pipeline,
// Docker Pipeline, Credentials Binding, SonarQube Scanner, Azure Credentials, JUnit, HTML Publisher, Timestamper,
// AnsiColor.
// All credential ids are parameters; the defaults are placeholders to create in Jenkins.

def SERVICES = [
  // name           : [build context,       Dockerfile (relative to repo root)]
  'auth'          : ['backend',            'backend/apps/auth/Dockerfile'],
  'orders'        : ['backend',            'backend/apps/orders/Dockerfile'],
  'planning'      : ['backend',            'backend/apps/planning/Dockerfile'],
  'fleet'         : ['backend',            'backend/apps/fleet/Dockerfile'],
  'outlets'       : ['backend',            'backend/apps/outlets/Dockerfile'],
  'trips'         : ['backend',            'backend/apps/trips/Dockerfile'],
  'sync'          : ['backend',            'backend/apps/sync/Dockerfile'],
  'notifications' : ['backend',            'backend/apps/notifications/Dockerfile'],
  'audit'         : ['backend',            'backend/apps/audit/Dockerfile'],
  'agent'         : ['backend/apps/agent', 'backend/apps/agent/Dockerfile'],
  'migrate'       : ['backend',            'backend/Dockerfile.migrate'],
  'gateway'       : ['backend/apps/gateway', 'backend/apps/gateway/Dockerfile'],
  'frontend'      : ['frontend',           'frontend/Dockerfile'],
  'mobile-web'    : ['mobile',             'mobile/Dockerfile'],
]

pipeline {
  agent { label 'docker' }

  options {
    timestamps()
    ansiColor('xterm')
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '30', artifactNumToKeepStr: '10'))
    timeout(time: 2, unit: 'HOURS')
  }

  triggers { pollSCM('H/5 * * * *') } // or a webhook

  parameters {
    string(name: 'ACR_LOGIN_SERVER',           defaultValue: 'crlodestardevadg01.azurecr.io', description: 'ACR login server (dev)')
    string(name: 'ACR_CREDENTIALS_ID',         defaultValue: 'acr-push',            description: 'Username/password credential: ACR token or service principal with AcrPush')
    string(name: 'AZURE_SP_CREDENTIALS_ID',    defaultValue: 'azure-sp-dev',        description: 'Azure Service Principal credential (Terraform ARM_* env)')
    string(name: 'TF_BACKEND_CREDENTIALS_ID',  defaultValue: 'tf-backend-dev-hcl',  description: 'Secret file: backend.hcl for infra/terraform/envs/dev')
    string(name: 'TF_VARS_CREDENTIALS_ID',     defaultValue: 'tf-vars-dev',         description: 'Secret file: terraform.tfvars for envs/dev')
    string(name: 'COSIGN_KEY_CREDENTIALS_ID',  defaultValue: 'cosign-key',          description: 'Secret file: cosign.key')
    string(name: 'COSIGN_PASSWORD_CREDENTIALS_ID', defaultValue: 'cosign-password', description: 'Secret text: cosign key password')
    string(name: 'SONARQUBE_SERVER',           defaultValue: 'sonarqube',           description: 'Name of the SonarQube server in Manage Jenkins')
    string(name: 'GIT_CREDENTIALS_ID',         defaultValue: 'github-gitops',       description: 'Username/password (PAT) allowed to push the GitOps commit')
    string(name: 'GITOPS_BRANCH',              defaultValue: 'main',                description: 'Branch Argo CD tracks for dev (deploy/argocd/envs/dev)')
    booleanParam(name: 'SKIP_TERRAFORM',       defaultValue: false,                 description: 'Skip terraform plan/apply')
    booleanParam(name: 'SKIP_DEPLOY',          defaultValue: false,                 description: 'Build and test only: no push, no infra, no GitOps bump')
  }

  environment {
    CI                  = 'true'
    COMPOSE_PROJECT_NAME = "lodestar-ci-${env.BUILD_NUMBER}"
    COMPOSE_DOCKER_CLI_BUILD = '1'
    DOCKER_BUILDKIT     = '1'
    IMAGE_TAG           = "dev-${env.GIT_COMMIT ? env.GIT_COMMIT.take(7) : env.BUILD_NUMBER}"
    NODE_IMAGE          = 'node:22-bookworm'
    PYTHON_IMAGE        = 'python:3.12-slim'
    PLAYWRIGHT_IMAGE    = 'mcr.microsoft.com/playwright:v1.63.0-noble' // keep in step with tests/e2e/package.json
    TRIVY_IMAGE         = 'aquasec/trivy:latest'
    COSIGN_IMAGE        = 'gcr.io/projectsigstore/cosign:v2.4.1'
    KUSTOMIZE_IMAGE     = 'registry.k8s.io/kustomize/kustomize:v5.4.3'
    TERRAFORM_IMAGE     = 'hashicorp/terraform:1.9'
    SONAR_SCANNER_IMAGE = 'sonarsource/sonar-scanner-cli:latest'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script {
          env.IMAGE_TAG = "dev-${sh(returnStdout: true, script: 'git rev-parse --short=7 HEAD').trim()}"
          // Our own GitOps commits must not start another release.
          def msg = sh(returnStdout: true, script: 'git log -1 --pretty=%B').trim()
          if (msg.contains('[gitops]')) {
            currentBuild.result = 'NOT_BUILT'
            currentBuild.description = 'GitOps tag bump; nothing to build'
            env.GITOPS_ONLY = 'true'
          }
        }
      }
    }

    stage('Unit tests') {
      when { not { environment name: 'GITOPS_ONLY', value: 'true' } }
      parallel {
        stage('frontend · lint, typecheck, Jest, build') {
          agent { docker { image "${env.NODE_IMAGE}"; reuseNode true; args '-e CYPRESS_INSTALL_BINARY=0 -e HOME=/tmp' } }
          steps {
            dir('frontend') {
              sh 'npm ci'
              sh 'npm run lint'
              sh 'npm run typecheck'
              sh 'npx jest --ci --coverage'
              sh 'npm run build'
            }
          }
          post { always { junit allowEmptyResults: true, testResults: 'frontend/reports/junit/*.xml' } }
        }
        stage('mobile · typecheck') {
          agent { docker { image "${env.NODE_IMAGE}"; reuseNode true; args '-e HOME=/tmp' } }
          steps { dir('mobile') { sh 'npm ci && npx tsc --noEmit' } }
        }
        stage('backend · lint, typecheck, Jest') {
          agent { docker { image "${env.NODE_IMAGE}"; reuseNode true; args '-e HOME=/tmp' } }
          environment { JEST_JUNIT_OUTPUT_DIR = 'reports/junit' }
          steps {
            dir('backend') {
              sh 'if [ -f package-lock.json ]; then npm ci; else npm install --no-audit --no-fund; fi'
              sh 'npx prisma generate'
              sh 'npm run lint'
              sh 'npm run typecheck'
              sh 'R=""; [ -d node_modules/jest-junit ] && R="--reporters=default --reporters=jest-junit"; npx jest --ci --coverage $R'
            }
          }
          post { always { junit allowEmptyResults: true, testResults: 'backend/reports/junit/*.xml' } }
        }
        stage('agent · pytest') {
          agent { docker { image "${env.PYTHON_IMAGE}"; reuseNode true; args '-e HOME=/tmp' } }
          steps {
            dir('backend/apps/agent') {
              sh '''
                python -m venv /tmp/venv && . /tmp/venv/bin/activate
                pip install -q -r requirements-dev.txt
                mkdir -p reports
                python -m pytest --junitxml=reports/pytest.xml --cov=lodestar_agent --cov-report=xml:coverage.xml
              '''
            }
          }
          post { always { junit allowEmptyResults: true, testResults: 'backend/apps/agent/reports/pytest.xml' } }
        }
        stage('tools · screengen syntax') {
          agent { docker { image "${env.NODE_IMAGE}"; reuseNode true } }
          steps { sh 'for f in tools/screengen/*.js; do node --check "$f" || exit 1; done' }
        }
      }
    }

    stage('Compose stack up') {
      when { not { environment name: 'GITOPS_ONLY', value: 'true' } }
      steps {
        sh '''
          [ -f .env ] || cp .env.example .env 2>/dev/null || true
          docker compose up -d --build --wait --wait-timeout 900
          # the gateway and Keycloak must answer before the suite starts
          for i in $(seq 1 90); do
            g=$(curl -ks -o /dev/null -w '%{http_code}' https://localhost:8443/ || true)
            k=$(curl -s  -o /dev/null -w '%{http_code}' http://localhost:8180/realms/lodestar || true)
            [ "$g" != "000" ] && [ "$k" = "200" ] && echo "stack is up (gateway $g, keycloak $k)" && exit 0
            sleep 5
          done
          docker compose ps; docker compose logs --tail=200; exit 1
        '''
      }
    }

    stage('Playwright (full stack)') {
      when { not { environment name: 'GITOPS_ONLY', value: 'true' } }
      agent { docker { image "${env.PLAYWRIGHT_IMAGE}"; reuseNode true; args '--network host --ipc=host -e HOME=/tmp' } }
      environment {
        E2E_REQUIRE_STACK = '1'
        E2E_BASE_URL      = 'https://localhost:8443'
        E2E_KEYCLOAK_URL  = 'http://localhost:8180'
        E2E_MOBILE_URL    = 'http://localhost:8082'
      }
      steps {
        dir('tests/e2e') {
          sh 'npm ci && npx playwright test'
        }
      }
      post {
        always {
          junit allowEmptyResults: true, testResults: 'tests/e2e/reports/junit.xml'
          publishHTML(target: [reportDir: 'tests/e2e/reports/html', reportFiles: 'index.html', reportName: 'Playwright report', keepAll: true, alwaysLinkToLastBuild: true, allowMissing: true])
          archiveArtifacts allowEmptyArchive: true, artifacts: 'tests/e2e/test-results/**'
        }
      }
    }

    stage('SonarQube') {
      when { not { environment name: 'GITOPS_ONLY', value: 'true' } }
      steps {
        withSonarQubeEnv(params.SONARQUBE_SERVER) {
          sh '''
            docker run --rm --network host \
              -e SONAR_HOST_URL="$SONAR_HOST_URL" -e SONAR_TOKEN="$SONAR_AUTH_TOKEN" \
              -v "$PWD:/usr/src" -w /usr/src "$SONAR_SCANNER_IMAGE" \
              -Dsonar.projectVersion="$IMAGE_TAG" -Dsonar.branch.name=main
          '''
        }
        timeout(time: 15, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }

    stage('Build images') {
      when { not { environment name: 'GITOPS_ONLY', value: 'true' } }
      steps {
        script {
          SERVICES.each { name, spec ->
            def (context, dockerfile) = spec
            if (!fileExists(dockerfile)) error("missing ${dockerfile} for ${name}")
            sh "docker build --pull -f ${dockerfile} -t ${params.ACR_LOGIN_SERVER}/lodestar/${name}:${env.IMAGE_TAG} --label org.opencontainers.image.revision=\$(git rev-parse HEAD) ${context}"
          }
        }
      }
    }

    stage('Trivy scan') {
      when { not { environment name: 'GITOPS_ONLY', value: 'true' } }
      steps {
        script {
          sh 'mkdir -p reports/trivy'
          SERVICES.keySet().each { name ->
            sh """
              docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v "\$PWD/reports/trivy:/out" -v trivy-cache:/root/.cache \
                ${env.TRIVY_IMAGE} image --scanners vuln,secret,misconfig --severity HIGH,CRITICAL --ignore-unfixed \
                --exit-code 1 --format table --output /out/${name}.txt \
                ${params.ACR_LOGIN_SERVER}/lodestar/${name}:${env.IMAGE_TAG}
            """
          }
        }
      }
      post { always { archiveArtifacts allowEmptyArchive: true, artifacts: 'reports/trivy/*.txt' } }
    }

    stage('Push to ACR and sign (cosign)') {
      when { allOf { not { environment name: 'GITOPS_ONLY', value: 'true' }; expression { !params.SKIP_DEPLOY } } }
      steps {
        withCredentials([
          usernamePassword(credentialsId: params.ACR_CREDENTIALS_ID, usernameVariable: 'ACR_USER', passwordVariable: 'ACR_PASSWORD'),
          file(credentialsId: params.COSIGN_KEY_CREDENTIALS_ID, variable: 'COSIGN_KEY_FILE'),
          string(credentialsId: params.COSIGN_PASSWORD_CREDENTIALS_ID, variable: 'COSIGN_PASSWORD'),
        ]) {
          script {
            sh 'echo "$ACR_PASSWORD" | docker login "$ACR_LOGIN_SERVER" -u "$ACR_USER" --password-stdin'
            SERVICES.keySet().each { name ->
              def ref = "${params.ACR_LOGIN_SERVER}/lodestar/${name}:${env.IMAGE_TAG}"
              sh "docker push ${ref}"
              // cosign signs the pushed digest (never a mutable tag)
              def digest = sh(returnStdout: true, script: "docker inspect --format='{{index .RepoDigests 0}}' ${ref}").trim()
              sh """
                docker run --rm -e COSIGN_PASSWORD -e COSIGN_YES=true \
                  -v "\$COSIGN_KEY_FILE:/cosign.key:ro" -v "\$HOME/.docker/config.json:/root/.docker/config.json:ro" \
                  ${env.COSIGN_IMAGE} sign --key /cosign.key --tlog-upload=false \
                  -a git.commit=\$(git rev-parse HEAD) -a ci.build=${env.BUILD_NUMBER} ${digest}
              """
            }
          }
        }
      }
      post { always { sh 'docker logout "$ACR_LOGIN_SERVER" || true' } }
    }

    stage('Terraform plan (dev)') {
      when { allOf { not { environment name: 'GITOPS_ONLY', value: 'true' }; expression { !params.SKIP_DEPLOY && !params.SKIP_TERRAFORM } } }
      steps {
        withCredentials([
          azureServicePrincipal(credentialsId: params.AZURE_SP_CREDENTIALS_ID,
            subscriptionIdVariable: 'ARM_SUBSCRIPTION_ID', clientIdVariable: 'ARM_CLIENT_ID',
            clientSecretVariable: 'ARM_CLIENT_SECRET', tenantIdVariable: 'ARM_TENANT_ID'),
          file(credentialsId: params.TF_BACKEND_CREDENTIALS_ID, variable: 'TF_BACKEND_HCL'),
          file(credentialsId: params.TF_VARS_CREDENTIALS_ID, variable: 'TF_VARS_FILE'),
        ]) {
          sh '''
            cp "$TF_BACKEND_HCL" infra/terraform/envs/dev/backend.hcl
            cp "$TF_VARS_FILE"   infra/terraform/envs/dev/terraform.tfvars
            tf() { docker run --rm -e ARM_SUBSCRIPTION_ID -e ARM_CLIENT_ID -e ARM_CLIENT_SECRET -e ARM_TENANT_ID -e TF_IN_AUTOMATION=1 \
                     -v "$PWD/infra/terraform:/tf" -w /tf/envs/dev "$TERRAFORM_IMAGE" "$@"; }
            tf init -input=false -backend-config=backend.hcl
            tf validate
            tf plan -input=false -out=tfplan
            tf show -no-color tfplan > tfplan.txt
          '''
        }
        archiveArtifacts allowEmptyArchive: true, artifacts: 'tfplan.txt'
      }
    }

    stage('Approve terraform apply') {
      when { allOf { not { environment name: 'GITOPS_ONLY', value: 'true' }; expression { !params.SKIP_DEPLOY && !params.SKIP_TERRAFORM } } }
      steps {
        timeout(time: 60, unit: 'MINUTES') {
          input message: "Apply the terraform plan for dev (build ${env.BUILD_NUMBER})?", ok: 'Apply', submitter: 'platform-admins'
        }
      }
    }

    stage('Terraform apply (dev)') {
      when { allOf { not { environment name: 'GITOPS_ONLY', value: 'true' }; expression { !params.SKIP_DEPLOY && !params.SKIP_TERRAFORM } } }
      steps {
        withCredentials([
          azureServicePrincipal(credentialsId: params.AZURE_SP_CREDENTIALS_ID,
            subscriptionIdVariable: 'ARM_SUBSCRIPTION_ID', clientIdVariable: 'ARM_CLIENT_ID',
            clientSecretVariable: 'ARM_CLIENT_SECRET', tenantIdVariable: 'ARM_TENANT_ID'),
        ]) {
          sh '''
            docker run --rm -e ARM_SUBSCRIPTION_ID -e ARM_CLIENT_ID -e ARM_CLIENT_SECRET -e ARM_TENANT_ID -e TF_IN_AUTOMATION=1 \
              -v "$PWD/infra/terraform:/tf" -w /tf/envs/dev "$TERRAFORM_IMAGE" apply -input=false tfplan
          '''
        }
      }
    }

    stage('GitOps: bump dev image tags') {
      when { allOf { not { environment name: 'GITOPS_ONLY', value: 'true' }; expression { !params.SKIP_DEPLOY } } }
      steps {
        script {
          def overlayImages = ['auth', 'orders', 'planning', 'fleet', 'outlets', 'trips', 'sync', 'notifications', 'audit', 'agent', 'frontend', 'mobile-web', 'migrate']
          def args = overlayImages.collect { "lodestar/${it}=${params.ACR_LOGIN_SERVER}/lodestar/${it}:${env.IMAGE_TAG}" }.join(' ')
          sh """
            docker run --rm -u \$(id -u):\$(id -g) -v "\$PWD/deploy/k8s:/k8s" -w /k8s/overlays/dev ${env.KUSTOMIZE_IMAGE} edit set image ${args}
            docker run --rm -v "\$PWD/deploy/k8s:/k8s" ${env.KUSTOMIZE_IMAGE} build /k8s/overlays/dev > /dev/null
          """
        }
        withCredentials([usernamePassword(credentialsId: params.GIT_CREDENTIALS_ID, usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
          sh '''
            git config user.name  "lodestar-ci"
            git config user.email "ci@lodestar.invalid"
            git add deploy/k8s/overlays/dev/kustomization.yaml
            if git diff --cached --quiet; then echo "tags already at $IMAGE_TAG"; exit 0; fi
            git commit -m "chore(dev): deploy $IMAGE_TAG [gitops] [skip ci]"
            origin=$(git remote get-url origin | sed -E 's#https://([^@]*@)?#https://#')
            git push "https://${GIT_USER}:${GIT_TOKEN}@${origin#https://}" "HEAD:${GITOPS_BRANCH}"
          '''
        }
        echo "Argo CD (lodestar-dev, auto-sync + self-heal) will roll out ${env.IMAGE_TAG} from deploy/k8s/overlays/dev."
      }
    }
  }

  post {
    always {
      sh 'docker compose logs --no-color > compose.log 2>&1 || true'
      archiveArtifacts allowEmptyArchive: true, artifacts: 'compose.log'
      sh 'docker compose down -v --remove-orphans || true'
      sh 'rm -f infra/terraform/envs/dev/backend.hcl infra/terraform/envs/dev/terraform.tfvars || true'
    }
  }
}
