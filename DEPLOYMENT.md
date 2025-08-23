# StoryMagic Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Setup ✅
- [ ] Copy `.env.example` to `.env`
- [ ] Configure all required API keys
- [ ] Set `NODE_ENV=production`
- [ ] Configure `CLIENT_URL` to your domain
- [ ] Set up database connection

### 2. Database Setup ✅
- [ ] Supabase project created
- [ ] Database schema deployed (run `database_setup.sql`)
- [ ] RLS policies configured
- [ ] Connection strings verified

### 3. Payment Integration ✅
- [ ] Lemon Squeezy store configured
- [ ] Product and variant created
- [ ] Webhook URL configured: `https://yourdomain.com/api/payment/lemonsqueezy/webhook`
- [ ] API keys and webhook secret set

### 4. Audio System ✅
- [ ] FFmpeg installed on server
- [ ] TTS API keys configured (ElevenLabs, OpenAI)
- [ ] Background music generation tested
- [ ] Audio mixing functionality verified

## Deployment Options

### Option 1: Railway (Recommended)

Railway is perfect for this app as it handles Node.js and provides easy environment variable management.

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Set environment variables
railway variables set SUPABASE_URL=your_url_here
railway variables set SUPABASE_SERVICE_ROLE_KEY=your_key_here
railway variables set OPENROUTER_API_KEY=your_key_here
# ... add all other environment variables

# Deploy
railway up
```

**Railway Configuration:**
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health/db",
    "healthcheckTimeout": 300
  }
}
```

### Option 2: Vercel

Vercel works well for full-stack apps but requires some configuration for Node.js backend.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

**Vercel Configuration (`vercel.json`):**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "dist/public/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/dist/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/public/$1"
    }
  ]
}
```

### Option 3: Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
```

**Docker Compose (`docker-compose.yml`):**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    env_file:
      - .env
    volumes:
      - ./tmp:/app/tmp
    restart: unless-stopped

  # Optional: Redis for session storage
  redis:
    image: redis:alpine
    restart: unless-stopped
```

### Option 4: Traditional VPS (Ubuntu)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install FFmpeg
sudo apt-get install -y ffmpeg

# Install PM2 for process management
sudo npm install -g pm2

# Clone repository
git clone https://your-repo.git
cd storymagic

# Install dependencies and build
npm ci
npm run build

# Configure environment
cp .env.example .env
# Edit .env with your values

# Start with PM2
pm2 start dist/index.js --name "storymagic"
pm2 save
pm2 startup

# Configure Nginx (optional)
sudo apt install nginx
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
    }
}
```

## Environment Variables Reference

### Required Variables
```env
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# AI Services
OPENROUTER_API_KEY=sk-or-v1-your_key

# Payment
LEMONSQUEEZY_API_KEY=your_api_key
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_VARIANT_ID=your_variant_id
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret

# Server
NODE_ENV=production
CLIENT_URL=https://your-domain.com
PORT=3000
```

### Optional Variables
```env
# Enhanced TTS
ELEVENLABS_API_KEY=your_elevenlabs_key
OPENAI_API_KEY=sk-your_openai_key

# Audio Settings
ENABLE_BACKGROUND_MUSIC=true
AUDIO_QUALITY=high
MAX_AUDIO_DURATION=600
```

## Post-Deployment Verification

### 1. Health Checks
```bash
# Database health
curl https://your-domain.com/api/health/db

# Supabase connectivity
curl https://your-domain.com/api/health/supabase

# Expected responses should show "ok": true
```

### 2. Feature Testing
- [ ] User registration/login
- [ ] Story generation (text input)
- [ ] PDF upload and processing
- [ ] Audio generation with different TTS providers
- [ ] Background music mixing
- [ ] Premium upgrade flow (Lemon Squeezy)
- [ ] Webhook processing

### 3. Performance Testing
```bash
# Test story generation endpoint
curl -X POST https://your-domain.com/api/story \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user" \
  -d '{"inputText": "Test story content", "narrationMode": "balanced"}'

# Test PDF upload
curl -X POST https://your-domain.com/api/upload-pdf \
  -H "x-user-id: test-user" \
  -F "pdf=@test.pdf" \
  -F "narrationMode=balanced"
```

## Monitoring & Maintenance

### 1. Log Monitoring
```bash
# Railway
railway logs

# PM2
pm2 logs storymagic

# Docker
docker logs container_name
```

### 2. Performance Monitoring
- Monitor CPU/memory usage during audio generation
- Track API response times
- Monitor database connection pool
- Watch for FFmpeg process leaks

### 3. Security Considerations
- [ ] API keys stored securely
- [ ] CORS configured properly
- [ ] Rate limiting implemented
- [ ] Webhook signature verification
- [ ] File upload size limits enforced

## Scaling Considerations

### Horizontal Scaling
- Use Redis for session storage
- Implement audio processing queue (Bull/Agenda)
- CDN for audio file delivery
- Database read replicas

### Performance Optimization
- Cache generated background music
- Implement audio preprocessing
- Use streaming for large files
- Optimize database queries

## Troubleshooting Common Issues

### 1. FFmpeg Not Found
```bash
# Check FFmpeg installation
which ffmpeg
ffmpeg -version

# Install if missing
# Ubuntu: sudo apt-get install ffmpeg
# macOS: brew install ffmpeg
```

### 2. Audio Generation Fails
- Check TTS API keys and quotas
- Verify FFmpeg permissions
- Monitor disk space for temp files
- Check audio mixing parameters

### 3. Payment Webhook Issues
- Verify webhook URL is accessible
- Check webhook signature verification
- Monitor webhook endpoint logs
- Test with Lemon Squeezy webhook tester

### 4. Database Connection Issues
- Verify Supabase URL and keys
- Check connection pool settings
- Monitor database performance
- Verify RLS policies

## Support & Resources

### Documentation Links
- [Supabase Docs](https://supabase.com/docs)
- [OpenRouter API](https://openrouter.ai/docs)
- [ElevenLabs API](https://elevenlabs.io/docs)
- [Lemon Squeezy Webhooks](https://docs.lemonsqueezy.com/webhooks)

### Monitoring Tools
- Uptime monitoring (UptimeRobot, Pingdom)
- Error tracking (Sentry)
- Performance monitoring (New Relic, DataDog)
- Log aggregation (LogRocket, Papertrail)

### Backup Strategy
- Database: Automated Supabase backups
- Environment: Store configs in secure vault
- Code: Git repository with tags
- Assets: Backup custom audio files
