# VAmPI Deployment Guide

## Git Workflow & Manual Deploy Strategy

This document outlines the Git workflow and **manual** Railway deployment configuration for the VAmPI (Vulnerable API) application.

**Note**: Due to corporate GitHub restrictions (we would need to install Railway 
app in apisec-inc), auto-deploy webhooks are not available. We use a **manual deployment workflow** with proper branch management.

## Branch Strategy

### Branch-Environment Mapping

| Branch Pattern | Environment | Deploy Method | Purpose |
|---------------|-------------|---------------|---------|
| `master` | Production | 🔧 **Manual** | Stable production releases |
| `develop` | Staging | 🔧 **Manual** | Integration testing and QA |
| `release/**` | Production | 🔧 **Manual** | Release candidates and hotfixes |
| `feature/**` | None | ❌ No deploy | Feature development (local testing only) |

### Environment URLs

- **Production**: https://urban-vampi-production.up.railway.app
- **Staging**: https://urban-vampi-staging.up.railway.app

## Manual Deployment Process

### Deploy to Staging (from develop branch)

```bash
# 1. Switch to develop and get latest changes
git checkout develop
git pull origin develop

# 2. Deploy to staging
railway environment staging
railway up
```

### Deploy to Production (from master branch)

```bash
# 1. Switch to master and get latest changes  
git checkout master
git pull origin master

# 2. Deploy to production
railway environment production
railway up
```

## Development Workflow (Updated)

### Feature Development

1. Create feature branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. Develop and commit your changes
3. Push feature branch for review:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create pull request to merge into `develop`
5. **After merge**: Manually deploy `develop` to staging for testing:
   ```bash
   git checkout develop
   git pull origin develop
   railway environment staging
   railway up
   ```

6. **After QA approval**: Merge `develop` to `master` and deploy to production

### Release Process

1. Create release branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/v1.2.3
   ```

2. Perform final testing and bug fixes on release branch
3. **Test deployment**: Deploy release branch to staging manually:
   ```bash
   railway environment staging
   railway up
   ```

4. Merge release branch to `master`:
   ```bash
   git checkout master
   git merge release/v1.2.3
   git tag v1.2.3
   git push origin master --tags
   ```

5. **Deploy to production**:
   ```bash
   railway environment production
   railway up
   ```

6. Merge back to `develop`:
   ```bash
   git checkout develop
   git merge release/v1.2.3
   git push origin develop
   ```

### Hotfix Process

1. Create hotfix branch from `master`:
   ```bash
   git checkout master
   git pull origin master
   git checkout -b release/hotfix-v1.2.4
   ```

2. Apply hotfix and test
3. **Test deployment**: Deploy hotfix to staging:
   ```bash
   railway environment staging
   railway up
   ```

4. Follow release process above (steps 4-6)

## Corporate GitHub Limitations

- ❌ Cannot install Railway GitHub app
- ❌ Auto-deploy webhooks not available  
- ✅ Manual deployment via Railway CLI
- ✅ Proper branch management and testing workflow
- ✅ Config-as-code for consistent deployments

## Railway Configuration

### Environment Variables

Set environment variables through Railway dashboard or CLI:

```bash
# Set variables for staging
railway environment staging
railway variables set KEY=value

# Set variables for production
railway environment production  
railway variables set KEY=value
```

### Service Configuration

- **Build Command**: Automatic (Nixpacks)
- **Start Command**: `python start_production.py`
- **Port**: 5050 (configured in `start_production.py` note that 
    railway needs(?) PORT=5000)

## Monitoring & Health Checks

### Health Check Endpoints

- **Version**: `/vampi_version` - Returns API version information
- **Health**: Basic Flask health check via root endpoint

### Environment Status

Check deployment status:

```bash
# Check staging
railway environment staging
railway status

# Check production
railway environment production
railway status
```

## Security Considerations

- **Production**: Vulnerable mode is DISABLED (`vulnerable=0`)
- **Staging**: Can be configured for testing vulnerable endpoints
- **Debug Mode**: Always disabled in production (`DEBUG=False`)

## Troubleshooting

### Common Issues

1. **Deployment Fails**: Check Railway logs via `railway logs`
2. **Environment Variables**: Verify variables are set in correct environment
3. **Branch Protection**: Ensure branch protection rules don't conflict with auto-deploy

### Railway CLI Commands

```bash
# Check current status
railway status

# View logs
railway logs

# Redeploy current version
railway redeploy

# Connect to service shell
railway shell
```

## Branch Protection Rules

Recommended GitHub branch protection settings:

### `master` branch:
- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date
- Include administrators

### `develop` branch:
- Require pull request reviews (optional)
- Allow force pushes from maintainers
- Include administrators 