resource "kubernetes_namespace_v1" "argocd" {
  metadata {
    name = var.namespace
    labels = {
      "app.kubernetes.io/part-of" = "argocd"
    }
  }
}

# Optional credentials for a private Git repo. Supplied at apply time by
# Jenkins (TF_VAR_git_repo_password from the `argocd-repo-token` credential);
# never committed. Prefer a GitHub App or read-only deploy token.
resource "kubernetes_secret_v1" "repo" {
  count = var.git_repo_password == null ? 0 : 1

  metadata {
    name      = "repo-lodestar"
    namespace = kubernetes_namespace_v1.argocd.metadata[0].name
    labels = {
      "argocd.argoproj.io/secret-type" = "repository"
    }
  }

  data = {
    type     = "git"
    url      = var.git_repo_url
    username = var.git_repo_username
    password = var.git_repo_password
  }
}

resource "helm_release" "argocd" {
  name       = "argo-cd"
  namespace  = kubernetes_namespace_v1.argocd.metadata[0].name
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  version    = var.argocd_chart_version
  timeout    = 900
  atomic     = true

  values = [yamlencode({
    global = {
      domain = var.argocd_hostname
    }
    configs = {
      params = {
        "server.insecure" = "false"
      }
      cm = {
        "admin.enabled"                      = tostring(var.admin_enabled)
        "exec.enabled"                       = "false"
        "application.resourceTrackingMethod" = "annotation"
        "timeout.reconciliation"             = "180s"
      }
      rbac = {
        "policy.default" = "role:readonly"
        "policy.csv"     = join("\n", [for g in var.admin_group_object_ids : "g, ${g}, role:admin"])
        "scopes"         = "[groups]"
      }
    }
    server = {
      service = {
        type = "ClusterIP" # reach via `kubectl port-forward` (Entra-authenticated kubectl)
      }
    }
    controller = {
      resources = {
        requests = { cpu = "250m", memory = "512Mi" }
        limits   = { memory = "1Gi" }
      }
    }
    repoServer = {
      resources = {
        requests = { cpu = "100m", memory = "256Mi" }
        limits   = { memory = "512Mi" }
      }
    }
    dex = {
      enabled = false
    }
    notifications = {
      enabled = var.notifications_enabled
    }
  })]
}

# App-of-apps. The bootstrap project may only create Argo CD objects in the
# argocd namespace from this repo; everything else is governed by the
# restricted lodestar-<env> AppProject defined in deploy/argocd.
resource "helm_release" "root_app" {
  name       = "lodestar-root"
  namespace  = kubernetes_namespace_v1.argocd.metadata[0].name
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argocd-apps"
  version    = var.argocd_apps_chart_version

  values = [yamlencode({
    projects = {
      lodestar-bootstrap = {
        namespace   = var.namespace
        description = "Bootstrap: root app-of-apps only"
        sourceRepos = [var.git_repo_url]
        destinations = [{
          server    = "https://kubernetes.default.svc"
          namespace = var.namespace
        }]
        clusterResourceWhitelist = []
        namespaceResourceWhitelist = [
          { group = "argoproj.io", kind = "Application" },
          { group = "argoproj.io", kind = "AppProject" },
        ]
      }
    }
    applications = {
      "lodestar-root-${var.environment}" = {
        namespace  = var.namespace
        project    = "lodestar-bootstrap"
        finalizers = ["resources-finalizer.argocd.argoproj.io"]
        source = {
          repoURL        = var.git_repo_url
          targetRevision = var.git_target_revision
          path           = "deploy/argocd/envs/${var.environment}"
        }
        destination = {
          server    = "https://kubernetes.default.svc"
          namespace = var.namespace
        }
        syncPolicy = {
          automated   = { prune = true, selfHeal = true }
          syncOptions = ["PruneLast=true"]
        }
      }
    }
  })]

  depends_on = [helm_release.argocd]
}
