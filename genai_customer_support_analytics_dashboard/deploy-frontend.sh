#!/bin/bash

# SupportIQ Frontend Deployment Script
# This script deploys the React frontend using CloudFormation with robust error handling

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="supportiq-frontend"
ENVIRONMENT="production"  # Change to: development, staging, or production
AWS_REGION="us-east-1"
TEMPLATE_FILE="cloudformation-frontend.yaml"

# Optional: Custom domain configuration
DOMAIN_NAME=""  # e.g., "supportiq.example.com"
CERTIFICATE_ARN=""  # ACM certificate ARN (must be in us-east-1 for CloudFront)

# Tracking variables
STACK_CREATED=false
DEPLOYMENT_FAILED=false

echo -e "${GREEN}=== SupportIQ Frontend Deployment ===${NC}"
echo ""

# Trap errors and cleanup
trap 'error_handler $? $LINENO' ERR
trap 'cleanup_on_exit' EXIT

# Error handler function
error_handler() {
    local exit_code=$1
    local line_number=$2
    echo ""
    echo -e "${RED}❌ Error occurred at line $line_number with exit code $exit_code${NC}"
    DEPLOYMENT_FAILED=true
}

# Cleanup function
cleanup_on_exit() {
    if [ "$DEPLOYMENT_FAILED" = true ] && [ "$STACK_CREATED" = true ]; then
        echo ""
        echo -e "${YELLOW}⚠️  Deployment failed. Do you want to rollback and delete the CloudFormation stack?${NC}"
        echo -e "${YELLOW}This will remove all created resources (S3 bucket, CloudFront distribution, etc.)${NC}"
        read -p "Delete stack '$STACK_NAME'? (yes/no): " -r
        echo
        if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            rollback_stack
        else
            echo -e "${BLUE}Stack '$STACK_NAME' was left in place. You can manually delete it later with:${NC}"
            echo -e "${BLUE}aws cloudformation delete-stack --stack-name $STACK_NAME --region $AWS_REGION${NC}"
        fi
    fi
}

# Function to rollback and delete stack
rollback_stack() {
    echo -e "${YELLOW}Rolling back deployment...${NC}"
    
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" &> /dev/null; then
        echo -e "${YELLOW}Checking stack status...${NC}"
        
        STACK_STATUS=$(aws cloudformation describe-stacks \
            --stack-name "$STACK_NAME" \
            --region "$AWS_REGION" \
            --query "Stacks[0].StackStatus" \
            --output text 2>/dev/null || echo "UNKNOWN")
        
        echo "Stack status: $STACK_STATUS"
        
        # If stack is in a deletable state
        if [[ "$STACK_STATUS" =~ ^(CREATE_COMPLETE|CREATE_FAILED|ROLLBACK_COMPLETE|UPDATE_COMPLETE|UPDATE_ROLLBACK_COMPLETE)$ ]]; then
            # Try to get bucket name and empty it first
            echo -e "${YELLOW}Emptying S3 bucket if it exists...${NC}"
            BUCKET_NAME=$(aws cloudformation describe-stacks \
                --stack-name "$STACK_NAME" \
                --region "$AWS_REGION" \
                --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
                --output text 2>/dev/null || echo "")
            
            if [ -n "$BUCKET_NAME" ] && [ "$BUCKET_NAME" != "None" ]; then
                echo "Found bucket: $BUCKET_NAME"
                aws s3 rm "s3://$BUCKET_NAME" --recursive --region "$AWS_REGION" 2>/dev/null || true
                echo -e "${GREEN}✓ Bucket emptied${NC}"
            fi
            
            # Delete the stack
            echo -e "${YELLOW}Deleting CloudFormation stack...${NC}"
            aws cloudformation delete-stack \
                --stack-name "$STACK_NAME" \
                --region "$AWS_REGION"
            
            echo -e "${YELLOW}Waiting for stack deletion to complete...${NC}"
            aws cloudformation wait stack-delete-complete \
                --stack-name "$STACK_NAME" \
                --region "$AWS_REGION" 2>/dev/null || true
            
            echo -e "${GREEN}✓ Stack deleted successfully${NC}"
        else
            echo -e "${RED}Stack is in state: $STACK_STATUS${NC}"
            echo -e "${RED}Cannot delete stack automatically. Please check AWS Console.${NC}"
        fi
    else
        echo -e "${YELLOW}Stack does not exist or already deleted${NC}"
    fi
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Install it from: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if user is logged in to AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: Not authenticated to AWS${NC}"
    echo "Run: aws configure"
    exit 1
fi

# Check if template file exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo -e "${RED}Error: Template file '$TEMPLATE_FILE' not found${NC}"
    exit 1
fi

# Function to check if stack exists
stack_exists() {
    aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        &> /dev/null
    return $?
}

# Function to deploy CloudFormation stack
deploy_stack() {
    echo -e "${YELLOW}Deploying CloudFormation stack...${NC}"
    
    # Check if stack already exists
    if stack_exists; then
        echo -e "${BLUE}Stack '$STACK_NAME' already exists. Updating...${NC}"
        STACK_CREATED=false  # Don't delete on failure if updating
    else
        echo -e "${BLUE}Creating new stack '$STACK_NAME'...${NC}"
        STACK_CREATED=true
    fi
    
    PARAMS=""
    PARAMS="$PARAMS ParameterKey=EnvironmentName,ParameterValue=$ENVIRONMENT"
    
    if [ -n "$DOMAIN_NAME" ]; then
        PARAMS="$PARAMS ParameterKey=DomainName,ParameterValue=$DOMAIN_NAME"
        echo -e "${BLUE}Using custom domain: $DOMAIN_NAME${NC}"
    fi
    
    if [ -n "$CERTIFICATE_ARN" ]; then
        PARAMS="$PARAMS ParameterKey=CertificateArn,ParameterValue=$CERTIFICATE_ARN"
        echo -e "${BLUE}Using ACM certificate${NC}"
    fi
    
    # Validate template first
    echo -e "${YELLOW}Validating CloudFormation template...${NC}"
    if ! aws cloudformation validate-template \
        --template-body "file://$TEMPLATE_FILE" \
        --region "$AWS_REGION" &> /dev/null; then
        echo -e "${RED}Template validation failed!${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ Template is valid${NC}"
    
    # Deploy the stack
    if aws cloudformation deploy \
        --template-file "$TEMPLATE_FILE" \
        --stack-name "$STACK_NAME" \
        --parameter-overrides $PARAMS \
        --region "$AWS_REGION" \
        --capabilities CAPABILITY_IAM \
        --no-fail-on-empty-changeset; then
        
        echo -e "${GREEN}✓ CloudFormation stack deployed successfully${NC}"
        
        # Wait for stack to be fully ready
        echo -e "${YELLOW}Waiting for stack to be ready...${NC}"
        aws cloudformation wait stack-create-complete \
            --stack-name "$STACK_NAME" \
            --region "$AWS_REGION" 2>/dev/null || \
        aws cloudformation wait stack-update-complete \
            --stack-name "$STACK_NAME" \
            --region "$AWS_REGION" 2>/dev/null || true
        
        echo -e "${GREEN}✓ Stack is ready${NC}"
        return 0
    else
        echo -e "${RED}CloudFormation deployment failed!${NC}"
        
        # Get stack events for debugging
        echo -e "${YELLOW}Recent stack events:${NC}"
        aws cloudformation describe-stack-events \
            --stack-name "$STACK_NAME" \
            --region "$AWS_REGION" \
            --max-items 10 \
            --query 'StackEvents[?ResourceStatus==`CREATE_FAILED` || ResourceStatus==`UPDATE_FAILED`].[Timestamp,ResourceType,LogicalResourceId,ResourceStatusReason]' \
            --output table 2>/dev/null || true
        
        return 1
    fi
}

# Function to build the React app
build_app() {
    echo -e "${YELLOW}Building React application...${NC}"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        echo -e "${RED}Error: package.json not found. Are you in the correct directory?${NC}"
        return 1
    fi
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}node_modules not found. Running npm install...${NC}"
        npm install
    fi
    
    # Build the app
    if npm run build; then
        echo -e "${GREEN}✓ Build completed${NC}"
        
        # Verify dist directory was created
        if [ ! -d "dist" ]; then
            echo -e "${RED}Error: dist directory was not created${NC}"
            return 1
        fi
        
        return 0
    else
        echo -e "${RED}Build failed!${NC}"
        return 1
    fi
}

# Function to upload files to S3
upload_to_s3() {
    echo -e "${YELLOW}Uploading files to S3...${NC}"
    
    # Verify dist directory exists
    if [ ! -d "dist" ]; then
        echo -e "${RED}Error: dist directory not found. Build may have failed.${NC}"
        return 1
    fi
    
    # Get bucket name from CloudFormation outputs
    BUCKET_NAME=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
        --output text 2>/dev/null)
    
    if [ -z "$BUCKET_NAME" ] || [ "$BUCKET_NAME" = "None" ]; then
        echo -e "${RED}Error: Could not retrieve bucket name from CloudFormation stack${NC}"
        echo -e "${RED}Stack may not have been created successfully${NC}"
        return 1
    fi
    
    echo -e "${BLUE}Bucket: $BUCKET_NAME${NC}"
    
    # Upload static assets with long cache
    echo -e "${YELLOW}Uploading static assets (JS, CSS, images)...${NC}"
    if ! aws s3 sync dist/ "s3://$BUCKET_NAME" \
        --delete \
        --region "$AWS_REGION" \
        --cache-control "public,max-age=31536000,immutable" \
        --exclude "*.html" \
        --exclude "*.json"; then
        echo -e "${RED}Failed to upload static assets${NC}"
        return 1
    fi
    
    # Upload HTML and JSON files with no cache
    echo -e "${YELLOW}Uploading HTML and JSON files...${NC}"
    if ! aws s3 sync dist/ "s3://$BUCKET_NAME" \
        --region "$AWS_REGION" \
        --cache-control "public,max-age=0,must-revalidate" \
        --exclude "*" \
        --include "*.html" \
        --include "*.json"; then
        echo -e "${RED}Failed to upload HTML/JSON files${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✓ Files uploaded to S3 successfully${NC}"
    return 0
}

# Function to invalidate CloudFront cache
invalidate_cloudfront() {
    echo -e "${YELLOW}Invalidating CloudFront cache...${NC}"
    
    # Get CloudFront distribution ID from CloudFormation outputs
    DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
        --output text 2>/dev/null)
    
    if [ -z "$DISTRIBUTION_ID" ] || [ "$DISTRIBUTION_ID" = "None" ]; then
        echo -e "${RED}Error: Could not retrieve CloudFront distribution ID${NC}"
        return 1
    fi
    
    echo -e "${BLUE}Distribution ID: $DISTRIBUTION_ID${NC}"
    
    # Create invalidation
    if INVALIDATION_OUTPUT=$(aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*" \
        2>&1); then
        
        INVALIDATION_ID=$(echo "$INVALIDATION_OUTPUT" | grep -o '"Id": "[^"]*"' | cut -d'"' -f4 || echo "unknown")
        echo -e "${GREEN}✓ CloudFront cache invalidation created (ID: $INVALIDATION_ID)${NC}"
        echo -e "${YELLOW}Note: Invalidation may take 5-15 minutes to complete${NC}"
        return 0
    else
        echo -e "${RED}Failed to create CloudFront invalidation${NC}"
        echo -e "${YELLOW}You can manually invalidate later with:${NC}"
        echo -e "${BLUE}aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths '/*'${NC}"
        return 1
    fi
}

# Function to display deployment info
show_info() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}    Deployment Complete Successfully!    ${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    
    # Get all outputs
    WEBSITE_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='WebsiteURL'].OutputValue" \
        --output text 2>/dev/null)
    
    CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomainName'].OutputValue" \
        --output text 2>/dev/null)
    
    BUCKET_NAME=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
        --output text 2>/dev/null)
    
    echo -e "${BLUE}Website URL:${NC} $WEBSITE_URL"
    echo -e "${BLUE}CloudFront Domain:${NC} $CLOUDFRONT_DOMAIN"
    echo -e "${BLUE}S3 Bucket:${NC} $BUCKET_NAME"
    echo ""
    echo -e "${YELLOW}⚠️  Important:${NC}"
    echo -e "  - CloudFront distribution may take 5-15 minutes to fully deploy"
    echo -e "  - Your site will be available at the URL above once ready"
    echo -e "  - HTTPS is automatically configured"
    echo ""
    echo -e "${BLUE}ℹ️  Next Steps:${NC}"
    echo -e "  1. Wait for CloudFront to fully deploy"
    echo -e "  2. Visit your website: $WEBSITE_URL"
    echo -e "  3. Check AWS Console if you encounter any issues"
    echo ""
}

# Main deployment flow
main() {
    echo -e "${BLUE}Starting deployment process...${NC}"
    echo -e "${BLUE}Stack: $STACK_NAME${NC}"
    echo -e "${BLUE}Region: $AWS_REGION${NC}"
    echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
    echo ""
    
    # Step 1: Deploy infrastructure
    echo -e "${YELLOW}[1/5] Deploying CloudFormation stack...${NC}"
    if ! deploy_stack; then
        echo -e "${RED}❌ CloudFormation deployment failed${NC}"
        return 1
    fi
    echo ""
    
    # Step 2: Build the app
    echo -e "${YELLOW}[2/5] Building React application...${NC}"
    if ! build_app; then
        echo -e "${RED}❌ Build failed${NC}"
        return 1
    fi
    echo ""
    
    # Step 3: Upload to S3
    echo -e "${YELLOW}[3/5] Uploading files to S3...${NC}"
    if ! upload_to_s3; then
        echo -e "${RED}❌ S3 upload failed${NC}"
        return 1
    fi
    echo ""
    
    # Step 4: Invalidate CloudFront
    echo -e "${YELLOW}[4/5] Invalidating CloudFront cache...${NC}"
    if ! invalidate_cloudfront; then
        echo -e "${YELLOW}⚠️  CloudFront invalidation failed (non-critical)${NC}"
        echo -e "${YELLOW}Your site is deployed but cache may need manual invalidation${NC}"
    fi
    echo ""
    
    # Step 5: Show deployment info
    echo -e "${YELLOW}[5/5] Deployment summary...${NC}"
    show_info
    
    return 0
}

# Run main function
if main; then
    echo -e "${GREEN}✓ All steps completed successfully!${NC}"
    exit 0
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi
