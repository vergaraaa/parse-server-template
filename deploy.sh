#!/bin/bash
set -e

# Remove old dist
rm -rf dist/

# Build TypeScript
npm run build

# Ensure public folder exists
mkdir -p ./dist/public

# Create minimal package.json with only dependencies
jq '{dependencies: .dependencies}' package.json > ./dist/cloud/package.json

# Create .parse.local file
cat > ./dist/.parse.local <<EOL
{
  "applications": {
    "_default": {
      "link": "test"
    },
    "test": {
      "applicationId": "DAZYcsIPJcoeQSHl0YBSQfuBCuUliUWK6NuplXcQ"
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
  "email": "edgar.vergara@cyberneid.com"
}
EOL

# Change to dist folder
cd dist

# Deploy
b4a deploy
