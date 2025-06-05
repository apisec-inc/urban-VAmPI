# GitHub Actions + Railway CLI Setup Guide

## 🎯 Automated Deployment Setup

This guide shows how to set up automated deployments using GitHub Actions with Railway CLI, bypassing the need for Railway GitHub app installation.

## ✅ **STATUS: STAGING DEPLOYMENT ACTIVE**

**Staging environment** is fully operational with automated deployments:
- 🚀 **Push to `develop`** → Auto-deploy to staging
- ✅ **RAILWAY_TOKEN_STAGING** configured and working
- ✅ **Health checks** passing
- ✅ **Deploy time**: ~1m 20s average

## Prerequisites

- ✅ Railway account with CLI access
- ✅ GitHub repository access 
- ✅ Repository admin access to configure secrets

## Step 1: Get Railway Authentication Tokens

**Environment-specific tokens are required** for staging and production:

### For Staging Environment:
```bash
# Switch to staging environment in Railway Dashboard
# Go to: https://railway.app/account/tokens
# Create token named: "GitHub-Actions-Staging"
```

### For Production Environment:
```bash
# Switch to production environment in Railway Dashboard  
# Go to: https://railway.app/account/tokens
# Create token named: "GitHub-Actions-Production"
```

## Step 2: Add GitHub Repository Secrets

1. **Navigate to GitHub Repository**:
   ```
   https://github.com/apisec-inc/urban-VAmPI/settings/secrets/actions
   ```

2. **Add Repository Secrets**:
   - Name: `RAILWAY_TOKEN_STAGING` → Value: Your staging Railway token
   - Name: `RAILWAY_TOKEN` → Value: Your production Railway token

## Step 3: Verify Workflows Status

### ✅ Staging Deployment (ACTIVE)
- **File**: `.github/workflows/deploy-staging.yml`
- **Triggers**: Push to `develop` branch
- **Token**: `RAILWAY_TOKEN_STAGING`
- **Environment**: staging
- **URL**: https://urban-vampi-staging.up.railway.app
- **Status**: 🟢 Fully operational

### 🟡 Production Deployment (CONFIGURED)
- **File**: `.github/workflows/deploy-production.yml`
- **Triggers**: Push to `master` branch, version tags
- **Token**: `RAILWAY_TOKEN`
- **Environment**: production  
- **URL**: https://urban-vampi-production.up.railway.app
- **Status**: 🟡 Ready for activation

## Step 4: Test Deployments

### ✅ Test Staging Deployment (VERIFIED WORKING)

```bash
git checkout develop
echo "# Test automated staging deployment $(date)" >> test-automation.md
git add test-automation.md
git commit -m "test: GitHub Actions automated staging deployment"
git push origin develop

# Verify deployment (auto-completes in ~1m 20s)
curl https://urban-vampi-staging.up.railway.app/
curl https://urban-vampi-staging.up.railway.app/deployment-test
```

### Test Production Deployment

```bash
git checkout master
git merge develop
git push origin master
```

## Expected Workflow Behavior

### ✅ On Push to `develop` (STAGING - ACTIVE):
1. GitHub Actions triggers staging workflow automatically
2. Installs Railway CLI in runner  
3. Authenticates with `RAILWAY_TOKEN_STAGING`
4. Deploys to staging environment
5. Verifies deployment with health checks
6. Reports success status in GitHub (typical: 1m 20s)

### On Push to `master` (PRODUCTION - READY):
1. GitHub Actions triggers production workflow
2. Uses `environment: production` for additional approval gates
3. Authenticates with `RAILWAY_TOKEN`
4. Deploys to production environment
5. Verifies deployment with health checks
6. Reports deployment summary

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
- **Environment-specific tokens** for staging vs production
- **Tokens stored** as GitHub encrypted secrets
- **Limited scope** to Railway deployment only
- **No source code access** from Railway tokens

## Troubleshooting

### ✅ Staging Issues (RESOLVED)
- **Token authentication**: Working with `RAILWAY_TOKEN_STAGING`
- **Deployment timing**: Consistent 1m 20s completion
- **Health checks**: All endpoints responding correctly

### Production Setup
```bash
# If production workflow fails:
# 1. Verify RAILWAY_TOKEN is set in GitHub secrets
# 2. Check production Railway environment access
# 3. Manual override always available:
railway environment production
railway up
```

### Token Issues
```bash
# Refresh Railway tokens if needed:
railway logout
railway login
# Update GitHub secrets with new tokens
```

## Benefits of This Approach

✅ **Corporate-friendly**: No Railway GitHub app required  
✅ **Automated**: Push-to-deploy workflow (staging proven)  
✅ **Secure**: GitHub encrypted secrets + environment-specific tokens  
✅ **Flexible**: Manual override always available  
✅ **Auditable**: Full deployment history in GitHub  
✅ **Reliable**: Built-in health checks and verification (staging verified)
✅ **Fast**: ~1m 20s deployment time BUT GitHub Runners delay that a lot

## Integration with Existing Workflow

This setup **enhances** the existing manual deployment process:
- **Maintains** all manual Railway CLI commands
- **Adds** automated deployment on push (staging active)
- **Keeps** the same branch-environment mapping
- **Preserves** all documentation and procedures

Developers can still use manual deployment for testing, debugging, or when automation is unavailable.

## Next Steps

1. ✅ **Staging**: Fully operational and tested
2. 🎯 **Production**: Ready for activation when needed
3. 📋 **Documentation**: Complete and up-to-date 