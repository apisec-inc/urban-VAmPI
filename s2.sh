cat >> configs/apisec/scan-config.yaml << 'EOF'

# VAmPI Vulnerable API Endpoints
vampi_endpoints:
  - path: "/users/v1"
    method: "GET"
  - path: "/users/v1/register" 
    method: "POST"
  - path: "/users/v1/login"
    method: "POST"
  - path: "/books/v1"
    method: "GET"
  - path: "/books/v1"
    method: "POST"
EOF