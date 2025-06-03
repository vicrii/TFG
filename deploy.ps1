# AWS Deployment Script for Learning Solana Platform
# This script automates the complete deployment process

param(
    [string]$ProjectName = "learning-solana",
    [string]$Environment = "production",
    [string]$Region = "us-east-1"
)

Write-Host "🚀 Starting AWS Deployment for $ProjectName" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Verify required tools
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Blue

if (-not (Test-Command "aws")) {
    Write-Error "AWS CLI is not installed. Please install it first."
    exit 1
}

if (-not (Test-Command "docker")) {
    Write-Error "Docker is not installed. Please install Docker Desktop."
    exit 1
}

# Check AWS credentials
Write-Host "🔐 Verifying AWS credentials..." -ForegroundColor Blue
try {
    aws sts get-caller-identity | Out-Null
    Write-Host "✅ AWS credentials are valid" -ForegroundColor Green
} catch {
    Write-Error "❌ AWS credentials are not configured properly"
    exit 1
}

# Set variables
$StackName = "$ProjectName-infrastructure"
$ECRRepositoryName = $ProjectName

Write-Host "`n🏗️  Step 1: Creating CloudFormation Stack..." -ForegroundColor Blue

# Deploy CloudFormation stack
aws cloudformation deploy `
    --template-file cloudformation-template.yaml `
    --stack-name $StackName `
    --parameter-overrides ProjectName=$ProjectName Environment=$Environment `
    --capabilities CAPABILITY_IAM `
    --region $Region

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ CloudFormation deployment failed"
    exit 1
}

Write-Host "✅ Infrastructure deployed successfully" -ForegroundColor Green

# Get stack outputs
Write-Host "`n📊 Getting stack outputs..." -ForegroundColor Blue
$ECRRepoURI = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --query "Stacks[0].Outputs[?OutputKey=='ECRRepositoryURI'].OutputValue" `
    --output text `
    --region $Region

Write-Host "ECR Repository: $ECRRepoURI" -ForegroundColor Yellow

Write-Host "`n🐳 Step 2: Building and pushing Docker image..." -ForegroundColor Blue

# Get ECR login
$ECRLogin = aws ecr get-login-password --region $Region
$ECRLogin | docker login --username AWS --password-stdin $ECRRepoURI.Split('/')[0]

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ ECR login failed"
    exit 1
}

# Build Docker image
Write-Host "Building Docker image..." -ForegroundColor Yellow
docker build -t $ECRRepositoryName .

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Docker build failed"
    exit 1
}

# Tag and push image
Write-Host "Tagging and pushing image..." -ForegroundColor Yellow
docker tag ${ECRRepositoryName}:latest $ECRRepoURI:latest
docker push $ECRRepoURI:latest

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Docker push failed"
    exit 1
}

Write-Host "✅ Docker image pushed successfully" -ForegroundColor Green

Write-Host "`n🔄 Step 3: Updating ECS service..." -ForegroundColor Blue

# Force new deployment of ECS service
aws ecs update-service `
    --cluster "$ProjectName-cluster" `
    --service "$ProjectName-service" `
    --force-new-deployment `
    --region $Region | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ ECS service update failed"
    exit 1
}

Write-Host "✅ ECS service updated successfully" -ForegroundColor Green

# Get application URLs
Write-Host "`n🌐 Getting application URLs..." -ForegroundColor Blue

$LoadBalancerDNS = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --query "Stacks[0].Outputs[?OutputKey=='LoadBalancerDNS'].OutputValue" `
    --output text `
    --region $Region

$CloudFrontDNS = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDNS'].OutputValue" `
    --output text `
    --region $Region

Write-Host "`n🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "📋 Application URLs:" -ForegroundColor Blue
Write-Host "   🔗 Load Balancer: http://$LoadBalancerDNS" -ForegroundColor Yellow
Write-Host "   🌐 CloudFront:    https://$CloudFrontDNS" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green

Write-Host "`n⏱️  Note: The application may take 5-10 minutes to be fully available" -ForegroundColor Yellow
Write-Host "🔍 You can monitor the deployment in the AWS Console:" -ForegroundColor Yellow
Write-Host "   - ECS Service: https://console.aws.amazon.com/ecs/home?region=$Region" -ForegroundColor Cyan
Write-Host "   - CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/home?region=$Region" -ForegroundColor Cyan

# Wait for service to be stable (optional)
$WaitForStable = Read-Host "`n🤔 Do you want to wait for the service to be stable? (y/N)"
if ($WaitForStable -eq "y" -or $WaitForStable -eq "Y") {
    Write-Host "⏳ Waiting for ECS service to be stable..." -ForegroundColor Blue
    aws ecs wait services-stable `
        --cluster "$ProjectName-cluster" `
        --services "$ProjectName-service" `
        --region $Region
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Service is now stable and ready!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Service deployment may still be in progress" -ForegroundColor Yellow
    }
}

Write-Host "`n🚀 Deployment script completed!" -ForegroundColor Green 