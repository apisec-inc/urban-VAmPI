# VAmPI Deployment Guide

## Git Workflow & Auto-Deploy Strategy

This document outlines the Git workflow and automated Railway deployment configuration for the VAmPI (Vulnerable API) application.

## Branch Strategy

### Branch-Environment Mapping

| Branch Pattern | Environment | Auto-Deploy | Purpose |
|---------------|-------------|-------------|---------|
| `master` | Production | ✅ Yes | Stable production releases |
| `develop` | Staging | ✅ Yes | Integration testing and QA |
| `release/**` | Production | ✅ Yes | Release candidates and hotfixes |
| `feature/**` | None | ❌ No | Feature development (manual testing only) |

### Environment URLs

- **Production**: https://urban-vampi-production.up.railway.app
- **Staging**: https://urban-vampi-staging.up.railway.app

## Deployment Process

### Automatic Deployments

1. **Staging Deployments**: Any push to `develop` branch triggers automatic deployment to staging
2. **Production Deployments**: Any push to `master` or `release/**` branches triggers automatic deployment to production

### Manual Deployments

For feature branches or manual deployments:

```bash
# Deploy to staging
railway environment staging
railway up

# Deploy to production  
railway environment production
railway up
```

## Development Workflow

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

### Release Process

1. Create release branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/v1.2.3
   ```

2. Perform final testing and bug fixes on release branch
3. Merge release branch to `master`:
   ```bash
   git checkout master
   git merge release/v1.2.3
   git tag v1.2.3
   git push origin master --tags
   ```

4. Merge back to `develop`:
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
3. Follow release process above

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