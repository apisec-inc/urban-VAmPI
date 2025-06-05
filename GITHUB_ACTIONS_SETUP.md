# GitHub Actions + Railway CLI Setup Guide

## 🎯 Automated Deployment Setup

This guide shows how to set up automated deployments using GitHub Actions with Railway CLI, bypassing the need for Railway GitHub app installation.

## Prerequisites

- ✅ Railway account with CLI access
- ✅ GitHub repository access 
- ✅ Repository admin access to configure secrets

## Step 1: Get Railway Authentication Token

```bash
# Login to Railway (if not already logged in)
railway login

# Verify your login and get account info
railway whoami

# The token is stored in your Railway config
# Location: ~/.railway/config.json
```

## Step 2: Add GitHub Repository Secret

1. **Navigate to GitHub Repository**:
   ```
   https://github.com/apisec-inc/urban-VAmPI/settings/secrets/actions
   ```

2. **Add New Repository Secret**:
   - Name: `RAILWAY_TOKEN`
   - Value: Your Railway authentication token

## Step 3: Verify Workflows

The following workflows are now configured:

### Staging Deployment (`.github/workflows/deploy-staging.yml`)
- **Triggers**: Push to `develop` branch
- **Environment**: staging
- **URL**: https://urban-vampi-staging.up.railway.app

### Production Deployment (`.github/workflows/deploy-production.yml`)
- **Triggers**: Push to `master` branch, version tags
- **Environment**: production  
- **URL**: https://urban-vampi-production.up.railway.app

## Step 4: Test Automated Deployment

### Test Staging Deployment

```bash
git checkout develop
echo "# Test automated staging deployment $(date)" >> test-automation.md
git add test-automation.md
git commit -m "test: GitHub Actions automated staging deployment"
git push origin develop
```

### Test Production Deployment

```bash
git checkout master
git merge develop
git push origin master
```

## Expected Workflow Behavior

### On Push to `develop`:
1. GitHub Actions triggers staging workflow
2. Installs Railway CLI in runner
3. Authenticates with `RAILWAY_TOKEN`
4. Deploys to staging environment
5. Verifies deployment with health checks
6. Reports status in GitHub

### On Push to `master`:
1. GitHub Actions triggers production workflow
2. Uses `environment: production` for additional approval gates
3. Deploys to production environment
4. Verifies deployment with health checks
5. Reports deployment summary

## Monitoring Deployments

### GitHub Actions UI
- **View workflows**: `https://github.com/apisec-inc/urban-VAmPI/actions`
- **Check logs**: Click on any workflow run
- **Manual trigger**: Use "Run workflow" button

### Railway Dashboard
- **Monitor deployments**: https://railway.app/dashboard
- **View logs**: Railway service logs
- **Check status**: Service health in Railway UI

## Security Features

### GitHub Environment Protection
- **Production environment** requires manual approval
- **Secrets scoped** to specific environments
- **Audit trail** of all deployments

### Railway Token Security
- **Token stored** as GitHub encrypted secret
- **Limited scope** to Railway deployment only
- **No source code access** from Railway token

## Troubleshooting

### Workflow Fails
```bash
# Check GitHub Actions logs
# Common issues:
# 1. RAILWAY_TOKEN not set or expired
# 2. Service ID mismatch
# 3. Network timeouts during deployment
```

### Manual Override
```bash
# If automation fails, manual deployment still works:
railway environment staging
railway up
```

### Token Issues
```bash
# Refresh Railway token
railway logout
railway login
# Update GitHub secret with new token
```

## Benefits of This Approach

✅ **Corporate-friendly**: No Railway GitHub app required  
✅ **Automated**: Push-to-deploy workflow  
✅ **Secure**: GitHub encrypted secrets  
✅ **Flexible**: Manual override always available  
✅ **Auditable**: Full deployment history in GitHub  
✅ **Reliable**: Built-in health checks and verification  

## Integration with Existing Workflow

This setup **enhances** the existing manual deployment process:
- **Maintains** all manual Railway CLI commands
- **Adds** automated deployment on push
- **Keeps** the same branch-environment mapping
- **Preserves** all documentation and procedures

Developers can still use manual deployment for testing, debugging, or when automation is unavailable. 