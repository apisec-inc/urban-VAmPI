# VAmPI
**The Vulnerable API** *(Based on OpenAPI 3)*

## 🔱 Fork Notice & Security Enhancements

This is a **production-ready fork** of the original [VAmPI project by erev0s](https://github.com/erev0s/VAmPI), enhanced with enterprise security best practices for safe deployment in controlled environments.

### 🔒 Production Security Improvements Applied:
- **Non-root Docker user configuration** - Container runs with dedicated user account (not root)
- **Enhanced containerization** - Production-capable Docker setup with security hardening
- **Deployment-ready configuration** - Safe for enterprise CI/CD pipeline integration
- **APIsec integration ready** - Configured for automated security scanning workflows

### 🎯 Purpose:
This fork maintains all original VAmPI vulnerability demonstrations while adding the security foundation necessary for:
- **Enterprise security training environments**
- **Automated security scanning demonstrations** 
- **CI/CD pipeline security testing**
- **Production-grade vulnerability assessment workflows**

⚠️ **Important:** While security-hardened for deployment, this API intentionally contains vulnerabilities for educational and testing purposes. Deploy only in controlled environments.

![vampi](https://i.imgur.com/zR0quKf.jpg)

[![Docker Image CI](https://github.com/erev0s/VAmPI/actions/workflows/docker-image.yml/badge.svg)](https://github.com/erev0s/VAmPI/actions/workflows/docker-image.yml) ![Docker Pulls](https://img.shields.io/docker/pulls/erev0s/vampi)


VAmPI is a vulnerable API made with Flask and it includes vulnerabilities from the OWASP top 10 vulnerabilities for APIs. It was created as I wanted a vulnerable API to evaluate the efficiency of tools used to detect security issues in APIs. It includes a switch on/off to allow the API to be vulnerable or not while testing. This allows to cover better the cases for false positives/negatives. VAmPI can also be used for learning/teaching purposes. You can find a bit more details about the vulnerabilities in [erev0s.com](https://erev0s.com/blog/vampi-vulnerable-api-security-testing/).


#### Features
 - Based on OWASP Top 10 vulnerabilities for APIs.
 - OpenAPI3 specs and Postman Collection included.
 - Global switch on/off to have a vulnerable environment or not.
 - Token-Based Authentication (Adjust lifetime from within app.py)
 - Available Swagger UI to directly interact with the API

VAmPI's flow of actions is going like this: an unregistered user can see minimal information about the dummy users included in the API. A user can register and then login to be allowed using the token received during login to post a book. For a book posted the data accepted are the title and a secret about that book. Each book is unique for every user and only the owner of the book should be allowed to view the secret.

A quick rundown of the actions included can be seen in the following table:

| **Action** |            **Path**           |                     **Details**                    |
|:----------:|:-----------------------------:|:--------------------------------------------------:|
|     GET    |           /createdb           | Creates and populates the database with dummy data |
|     GET    |               /               |                     VAmPI home                     |
|     GET    |               /me             |           Displays the user that is logged in       |
|     GET    |           /users/v1           |      Displays all users with basic information     |
|     GET    |        /users/v1/_debug       |         Displays all details for all users         |
|    POST    |       /users/v1/register      |                  Register new user                 |
|    POST    |        /users/v1/login        |                   Login to VAmPI                   |
|     GET    |      /users/v1/{username}     |              Displays user by username             |
|   DELETE   |      /users/v1/{username}     |       Deletes user by username (Only Admins)       |
|     PUT    |   /users/v1/{username}/email  |             Update a single users email            |
|     PUT    | /users/v1/{username}/password |                Update users password               |
|     GET    |           /books/v1           |                 Retrieves all books                |
|    POST    |           /books/v1           |                    Add new book                    |
|     GET    |        /books/v1/{book}       |      Retrieves book by title along with secret     |

For more details you can either run VAmPI and visit `http://127.0.0.1:5000/ui/` or use a service like the [swagger editor](https://editor.swagger.io) supplying the OpenAPI specification which can be found in the directory `openapi_specs`.


#### List of Vulnerabilities
 - SQLi Injection
 - Unauthorized Password Change
 - Broken Object Level Authorization
 - Mass Assignment
 - Excessive Data Exposure through debug endpoint
 - User and Password Enumeration
 - RegexDOS (Denial of Service)
 - Lack of Resources & Rate Limiting
 - JWT authentication bypass via weak signing key



 ## Run it
It is a Flask application so in order to run it you can install all requirements and then run the `app.py`.
To install all requirements simply run `pip3 install -r requirements.txt` and then `python3 app.py`.

Or if you prefer you can also run it through docker or docker compose.

 #### Run it through Docker

 - Available in [Dockerhub](https://hub.docker.com/r/erev0s/vampi)
~~~~
docker run -p 5000:5000 erev0s/vampi:latest
~~~~

[Note: if you run Docker on newer versions of the MacOS, use `-p 5001:5000` to avoid conflicting with the AirPlay Receiver service. Alternatively, you could disable the AirPlay Receiver service in your System Preferences -> Sharing settings.]

  #### Run it through Docker Compose
`docker-compose` contains two instances, one instance with the secure configuration on port 5001 and another with insecure on port 5002:
~~~~
docker-compose up -d
~~~~

## Available Swagger UI :rocket:
Visit the path `/ui` where you are running the API and a Swagger UI will be available to help you get started!
~~~~
http://127.0.0.1:5000/ui/
~~~~

## Customizing token timeout and vulnerable environment or not
If you would like to alter the timeout of the token created after login or if you want to change the environment **not** to be vulnerable then you can use a few ways depending how you run the application.

 - If you run it like normal with `python3 app.py` then all you have to do is edit the `alive` and `vuln` variables defined in the `app.py` itself. The `alive` variable is measured in seconds, so if you put `100`, then the token expires after 100 seconds. The `vuln` variable is like boolean, if you set it to `1` then the application is vulnerable, and if you set it to `0` the application is not vulnerable.
 - If you run it through Docker, then you must either pass environment variables to the `docker run` command or edit the `Dockerfile` and rebuild. 
   - Docker run example: `docker run -d -e vulnerable=0 -e tokentimetolive=300 -p 5000:5000 erev0s/vampi:latest`
     - One nice feature to running it this way is you can startup a 2nd container with `vulnerable=1` on a different port and flip easily between the two.

   - In the Dockerfile you will find two environment variables being set, the `ENV vulnerable=1` and the `ENV tokentimetolive=60`. Feel free to change it before running the docker build command.


## Frequently asked questions
 - **There is a database error upon reaching endpoints!**
   - Make sure to issue a request towards the endpoint `/createdb` in order to populate the database.

 [Picture from freepik - www.freepik.com](https://www.freepik.com/vectors/party)

## Getting Started
Essential curl commands
Database must be initialized on first deploy
```bash
curl -s https://urban-vampi-production.up.railway.app/users/v1 | head -20
curl -s https://urban-vampi-production.up.railway.app/createdb
curl -s https://urban-vampi-production.up.railway.app/users/v1
# Connect to staging
railway environment staging
# Check environments and their triggers
railway service urban-VAmPI# && railway status
```

Link current dir to staging
```bash
railway link -p 2e10ac7e-3afd-460c-956d-ce5a9a84577c
```

Troubleshooting environments and deployments
```bash
# Initial Railway environment check
railway status

# Switch to production environment and check service
railway environment production
railway service urban-VAmPI#
railway status

# Check production domain 
railway domain

# Check environment variables in production
railway variables

# Test API endpoints
curl -s https://urban-vampi-production.up.railway.app/createdb
curl -s https://urban-vampi-production.up.railway.app/users/v1

# Check git branch structure
git branch -a

# Switch to staging environment
railway environment staging
railway service urban-VAmPI# && railway status

# Check git remotes
git remote -v

# Check recent commit history
git log --oneline -5

# Test deployment behavior - make a test change
git add . && git commit -m "test: deployment strategy tracking comment" && git push origin master

# Monitor environments after push
railway environment production && railway service urban-VAmPI#
curl -s https://urban-vampi-production.up.railway.app/ | grep -o "VAmPI.*API"

railway environment staging && railway service urban-VAmPI#
railway logs | head -5

# Final status check
railway status

# Service Validation
echo "=== STAGING ENVIRONMENT ===" && curl -s https://urban-vampi-staging.up.railway.app/ | grep -o "VAmPI.*API" && echo -e "\n=== PRODUCTION ENVIRONMENT ===" && curl -s https://urban-vampi-production.up.railway.app/ | grep -o "VAmPI.*API"

# Comprehensive Service Validation
echo "=== VAMPI DEPLOYMENT STATUS REPORT ===" && echo "Generated: $(date)" && echo -e "\n🚀 STAGING ENVIRONMENT:" && echo "URL: https://urban-vampi-staging.up.railway.app" && echo "Status: $(curl -s https://urban-vampi-staging.up.railway.app/ | jq -r '.message // "Error"')" && echo "Users: $(curl -s https://urban-vampi-staging.up.railway.app/users/v1 | jq -r '.users | length') users loaded" && echo -e "\n🏭 PRODUCTION ENVIRONMENT:" && echo "URL: https://urban-vampi-production.up.railway.app" && echo "Status: $(curl -s https://urban-vampi-production.up.railway.app/ | jq -r '.message // "Error"')" && echo "Users: $(curl -s https://urban-vampi-production.up.railway.app/users/v1 | jq -r '.users | length') users loaded"
```

VAmPI Home Endpoint and Deployemnt Test Endpoint 9.1
```bash
curl https://urban-vampi-staging.up.railway.app/
curl https://urban-vampi-staging.up.railway.app/deployment-test
```

## Railway Operations & Deployment Guide

### Current Environment Setup
- **Project**: pacific-mindfulness
- **Service**: urban-VAmPI#
- **Production**: https://urban-vampi-production.up.railway.app (from `master` branch)
- **Staging**: https://urban-vampi-staging.up.railway.app (from `develop` branch)

### Manual Deployment Commands

#### Deploy to Staging
```bash
git checkout develop
git pull origin develop
railway environment staging
railway up
# check that staging endpoints are live
curl -s https://urban-vampi-staging.up.railway.app/ | head -1 && \
curl -s https://urban-vampi-staging.up.railway.app/deployment-test
```

#### Deploy to Production
```bash
git checkout master
git pull origin master
railway environment production
railway up
# check that production endpoints are live
curl -s https://urban-vampi-production.up.railway.app/ | head -1
curl -s https://urban-vampi-production.up.railway.app/deployment-test
```

### Railway Environment Management
```bash
# Check current status
railway status

# Switch environments
railway environment staging
railway environment production

# Link service if disconnected
railway service urban-VAmPI#

# View logs
railway logs

# Check environment variables
railway variables

# Set environment variables
railway variables set KEY=value
```

### Environment Variables Configuration

#### Both Environments
```bash
PORT=5000  # Railway's expected port
```

#### Staging Environment
```bash
RAILWAY_ENVIRONMENT=staging
vulnerable=1  # Enable vulnerable mode for testing
```

#### Production Environment
```bash
RAILWAY_ENVIRONMENT=production
vulnerable=0  # Disable vulnerable mode for security
```

### Troubleshooting
- **Build fails**: Check Railway dashboard build logs
- **Service disconnected**: Run `railway service urban-VAmPI#`
- **Environment issues**: Verify variables with `railway variables`
- **Deploy fails**: Check `railway.json` configuration and `start_production.py`

**Note**: Due to corporate GitHub restrictions, auto-deploy webhooks are not available. All deployments are manual via Railway CLI. See `DEPLOYMENT.md` for detailed Git workflow instructions.

## 🤖 Automated Deployment Option

For **automated deployments** using GitHub Actions + Railway CLI (corporate-friendly alternative to Railway webhooks):

👉 **See [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md)** for complete setup instructions

**Benefits:**
- ✅ **Push-to-deploy** workflow (develop → staging, master → production)
- ✅ **No Railway GitHub app** required (bypasses corporate restrictions)
- ✅ **Manual deployment fallback** always available
- ✅ **Built-in health checks** and deployment verification

**Quick Setup:**
1. Add `RAILWAY_TOKEN` to GitHub repository secrets
2. GitHub Actions workflows are already configured
3. Push to `develop` or `master` to trigger automated deployment