#!/bin/bash
set -e

# Remove old dist
rm -rf dist/

# Build TypeScript (Using PNPM)
pnpm run build

# Ensure public folder exists
mkdir -p ./dist/public

# Create minimal package.json with only dependencies
jq '{dependencies: .dependencies}' package.json > ./dist/cloud/package.json

# Create .parse.local file
cat > ./dist/.parse.local <<EOL
{
  "applications": {
    "_default": {
      "link": "<YOUR_APP_NAME>"
    },
    "<YOUR_APP_NAME>": {
      "applicationId": "<YOUR_APP_ID>"
    }
  }
}
EOL

# Create .parse.project file
cat > ./dist/.parse.project <<EOL
{
  "project_type": 1,
  "parse": {
    "jssdk": "2.2.25"
  },
  "email": "<YOUR_EMAIL>"
}
EOL

# Change to dist folder
cd dist

# Deploy
b4a deploy