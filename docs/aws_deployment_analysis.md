# Mercadolibre Price Tracker — AWS Deployment Analysis

**Purpose:** Evaluate AWS as a backend hosting alternative to DigitalOcean App Platform.
**Last Updated:** June 18, 2026

**Related files:**
- `mercadolibre_tracker_simplified.md` — Main spec (current: DigitalOcean + Supabase)
- `backend_technical.md` — Implementation code (Node.js + Express)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Important Note: App Runner Discontinued](#important-note-app-runner-discontinued)
3. [AWS Service Options Compared](#aws-service-options-compared)
4. [Recommended Architecture](#recommended-architecture)
5. [Cost Breakdown — ECS Fargate](#cost-breakdown--ecs-fargate)
6. [Cost Breakdown — EC2 (Lower Cost Option)](#cost-breakdown--ec2-lower-cost-option)
7. [Hidden Costs to Watch](#hidden-costs-to-watch)
8. [AWS vs Current Stack (DigitalOcean + Supabase)](#aws-vs-current-stack-digitalocean--supabase)
9. [Background Jobs on AWS](#background-jobs-on-aws)
10. [Database Options on AWS](#database-options-on-aws)
11. [Migration Considerations](#migration-considerations)
12. [Final Recommendation](#final-recommendation)

---

## Executive Summary

| | Current Stack | AWS (Fargate) | AWS (EC2) |
|--|---------------|----------------|-----------|
| **Backend hosting** | DigitalOcean App Platform | ECS Fargate | EC2 t3.small |
| **Database** | Supabase Pro | RDS PostgreSQL or keep Supabase | RDS PostgreSQL or keep Supabase |
| **Monthly cost (backend only)** | $20 | ~$45–65 | ~$20–25 |
| **Monthly cost (backend + DB)** | $45 (with Supabase) | ~$95–120 (with RDS) or ~$70 (keep Supabase) | ~$45–50 (keep Supabase) |
| **Setup complexity** | Low | High | Medium |
| **Operational overhead** | Minimal | High (VPC, NAT, IAM, ECS) | Medium (server management) |
| **Scaling** | Automatic, simple | Automatic, complex config | Manual or Auto Scaling Group |

**Bottom line:** For this app's current scale (MVP, low traffic), **AWS costs more and requires significantly more setup** than the current DigitalOcean + Supabase stack. AWS becomes worth it at higher scale or if the team already has AWS expertise/infrastructure.

---

## Important Note: App Runner Discontinued

AWS App Runner — the closest AWS equivalent to "Heroku-style" simple deployment — will no longer be open to new customers starting April 30, 2026. This eliminates the simplest AWS option for this app's use case.

**Impact:** Without App Runner, the realistic AWS options are:
1. **ECS Fargate** — serverless containers (recommended if going AWS)
2. **EC2** — traditional virtual machine (cheaper, more management)
3. **Elastic Beanstalk** — wraps EC2 with some automation (middle ground)

---

## AWS Service Options Compared

| Service | Description | Best For | Complexity |
|---------|-------------|----------|------------|
| **ECS Fargate** | Serverless containers, AWS manages infrastructure | Production apps wanting "managed" feel | High initial setup, low ongoing maintenance |
| **EC2** | Traditional VM, you manage everything | Cost-sensitive, predictable workloads | Medium setup, ongoing OS/security patching |
| **Elastic Beanstalk** | PaaS wrapper around EC2 + ALB | Teams wanting Heroku-like DX without App Runner | Medium setup, EC2-level costs |
| **Lambda** | Serverless functions | NOT suitable — Express app + background jobs don't fit well | N/A |

**Recommendation if going AWS:** ECS Fargate for the API server, EventBridge for cron-replacement of background jobs.

---

## Recommended Architecture

```
┌─────────────────────────────────────────────────┐
│              Expo Mobile App                     │
└──────────────────────┬────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼────────────────────────────┐
│         Application Load Balancer (ALB)           │
│         + ACM SSL Certificate (free)               │
└──────────────────────┬────────────────────────────┘
                       │
┌──────────────────────▼────────────────────────────┐
│         ECS Fargate Service                       │
│         (Node.js + Express, 0.5 vCPU / 1GB)        │
│         Auto-scaling: 1-3 tasks                    │
└──────────────────────┬────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬─────────────┐
        │              │              │             │
┌───────▼──────┐ ┌────▼────────┐ ┌───▼──────┐ ┌────▼─────┐
│ Supabase Pro │ │ EventBridge  │ │ Secrets  │ │CloudWatch│
│ (keep as-is) │ │ (cron jobs)  │ │ Manager  │ │  (logs)  │
└──────────────┘ └──────────────┘ └──────────┘ └──────────┘

EventBridge triggers → Lambda function → calls ECS task
(replaces node-cron hourly price check job)
```

**Key decision: Keep Supabase, don't migrate to RDS.**
Migrating the database to AWS RDS adds significant cost and complexity with no functional benefit — Supabase already handles backups, RLS, and connection pooling. Only the **compute layer** (currently DigitalOcean App Platform) needs to move to AWS Fargate/EC2.

---

## Cost Breakdown — ECS Fargate

Based on AWS Fargate pricing of $0.04048 per vCPU-hour and $0.004445 per GB-hour, running 24/7.

### Single Task: 0.5 vCPU / 1GB (matches current DigitalOcean sizing)

```
vCPU:   0.5 × $0.04048/hr × 730 hrs = $14.78/month
Memory: 1GB × $0.004445/hr × 730 hrs = $3.24/month
─────────────────────────────────────────────────
Fargate compute subtotal:              $18.02/month
```

### Required Supporting Infrastructure

| Component | Monthly Cost | Notes |
|-----------|-------------|-------|
| Fargate compute (0.5 vCPU/1GB) | $18.02 | 0.5 vCPU / 1GB costs $17.87/month, matches calc |
| Application Load Balancer | ~$16-22 | ALB costs approximately $22/month |
| NAT Gateway (if private subnet) | ~$33 | Each NAT Gateway costs $32.40/month just to exist |
| NAT data processing | ~$5-15 | $0.045/GB processed, depends on Decodo API calls volume |
| Public IPv4 (if used) | ~$3.60 | $0.005/hour per public IP = $3.60/month |
| CloudWatch Logs | ~$2-5 | Log ingestion + storage |
| ECR (container registry) | ~$1 | Image storage, minimal for one app |
| **Total (Fargate, private subnet + NAT)** | **~$78-95/month** | |
| **Total (Fargate, public subnet, no NAT)** | **~$40-50/month** | Less secure but cheaper for MVP |

> **Important:** The biggest hidden cost is NAT Gateway for tasks in private subnets pulling images or calling AWS APIs. For this app, Decodo API calls and Stripe/Clerk webhooks need outbound internet — if Fargate runs in a private subnet, NAT Gateway charges apply on every outbound byte.

### Cost-Saving Variant: Public Subnet (No NAT Gateway)

Running Fargate tasks directly in a public subnet (with security group restricting inbound) avoids the NAT Gateway entirely:

```
Fargate compute:        $18.02/month
ALB:                     $20.00/month
Public IPv4 (task ENI):   $3.60/month
CloudWatch Logs:          $3.00/month
ECR:                      $1.00/month
─────────────────────────────────────
Total:                   ~$45.62/month
```

This is the most cost-comparable option to DigitalOcean, but sacrifices the private-subnet security best practice.

---

## Cost Breakdown — EC2 (Lower Cost Option)

EC2 launch type is 40-60% cheaper than Fargate due to bin-packing efficiency. For a single small app, a `t4g.small` (ARM/Graviton, 2 vCPU, 2GB) reserved instance:

```
EC2 t4g.small (On-Demand):     ~$12.13/month
EC2 t4g.small (1yr Reserved):  ~$7.50/month  (38% savings)
EBS volume (20GB gp3):          ~$1.60/month
Elastic IP (if used):           ~$3.60/month
CloudWatch Logs:                ~$2-3/month
─────────────────────────────────────────────
Total (On-Demand):              ~$19-21/month
Total (Reserved):                ~$15-16/month
```

**Trade-off:** You manage the OS, security patches, Node.js runtime, process manager (PM2), and deployment pipeline yourself. No auto-scaling without an Auto Scaling Group (additional ALB + complexity).

This is the **closest cost match to DigitalOcean's $20/month**, but requires significantly more DevOps work: patching, monitoring, deployment scripts, and no managed auto-restart on crash without manual PM2/systemd configuration.

---

## Hidden Costs to Watch

These are the AWS-specific charges that **don't exist** on DigitalOcean and are easy to miss when estimating:

| Cost | Amount | Why It Applies Here |
|------|--------|---------------------|
| Public IPv4 charges | $0.005/hr per IP (~$3.60/mo) | Started Feb 2024 — applies to EC2, NAT Gateway, ALB, all public-facing resources |
| NAT Gateway hourly | $32.85/mo per gateway | Required if Fargate/EC2 in private subnet needs outbound internet (Decodo, Stripe, Clerk, Firebase calls) |
| NAT data processing | $0.045/GB | Charged on every GB through NAT, in addition to standard data transfer |
| CloudWatch Logs ingestion | ~$0.50/GB | Can add up with verbose logging (background job runs hourly) |
| Data transfer OUT | $0.09/GB (after free tier) | API responses to mobile app, webhook responses |
| ECR storage | $0.10/GB-month | Minimal for one small Node.js image |

**Total realistic "surprise factor":** For a typical microservice running 24/7, Fargate compute is only about 68% of the total bill — meaning actual costs typically run 30-40% higher than the raw compute calculator estimate.

---

## AWS vs Current Stack (DigitalOcean + Supabase)

| | Current (DO + Supabase) | AWS Fargate (public subnet) | AWS Fargate (private + NAT) | AWS EC2 |
|--|--------------------------|-------------------------------|--------------------------------|---------|
| Backend compute | $20/mo | $45.62/mo | $78-95/mo | $19-21/mo |
| Database (Supabase Pro, unchanged) | $25/mo | $25/mo | $25/mo | $25/mo |
| **Total** | **$45/mo** | **~$70.62/mo** | **~$103-120/mo** | **~$44-46/mo** |
| Setup time | ~1 day | ~3-5 days | ~5-7 days | ~2-3 days |
| Ongoing maintenance | Minimal | Low-Medium | Low-Medium | Medium-High |
| Auto-deploy on git push | ✅ Built-in | ⚠️ Requires CodePipeline setup | ⚠️ Requires CodePipeline setup | ❌ Manual or custom CI/CD |
| Free SSL | ✅ Built-in | ✅ ACM (free) | ✅ ACM (free) | ⚠️ Manual (Let's Encrypt) |
| Auto-scaling | ✅ Built-in | ✅ Native | ✅ Native | ⚠️ Requires ASG + ALB |
| Team AWS expertise needed | None | Moderate-High | High | Moderate |

---

## Background Jobs on AWS

The current spec uses `node-cron` running inside the same Node.js process (hourly price check job, downgrade job). On AWS this pattern still works inside ECS/EC2, but the AWS-native alternative is:

### Option A: Keep node-cron in the same container (simplest)
- No additional AWS cost
- Works identically to current DigitalOcean setup
- Risk: if the container restarts mid-job, in-memory concurrency lock (GAP-03 fix) resets — same risk as today

### Option B: AWS EventBridge Scheduler + Lambda (AWS-native)
- EventBridge triggers a Lambda function every hour
- Lambda calls an internal API endpoint or runs the job logic directly
- **Cost:** EventBridge Scheduler is effectively free at this volume (charges per invocation, negligible). Lambda: free tier covers 1M requests/month
- **Benefit:** Decouples job execution from the API server — no concurrency lock needed, AWS guarantees single execution
- **Added complexity:** Requires packaging job logic separately, IAM permissions, VPC config for Lambda to reach Supabase

**Recommendation:** Option A (keep node-cron) unless team wants to invest in full AWS-native architecture. Option B is the "correct" AWS pattern but adds setup overhead disproportionate to this app's scale.

---

## Database Options on AWS

| Option | Monthly Cost | Recommendation |
|--------|-------------|-----------------|
| **Keep Supabase Pro** | $25/mo | ✅ Recommended — no migration risk, keeps RLS, backups, dashboard |
| **AWS RDS PostgreSQL (db.t4g.micro)** | ~$25-35/mo + storage/backup | Only if consolidating fully into AWS for compliance/billing reasons |
| **Aurora Serverless v2** | ~$45+/mo (0.5 ACU minimum) | Overkill for this app's scale — designed for variable/bursty enterprise workloads |

**Recommendation:** Do not migrate the database. Supabase already solved this well at $25/month with features (RLS, auto backups, dashboard) that would take additional engineering time to replicate on RDS. Migrating only the compute layer to AWS while keeping Supabase is the lowest-risk path if AWS is desired for other reasons (e.g., company-wide AWS standardization).

---

## Migration Considerations

If moving from DigitalOcean to AWS, account for:

1. **VPC setup** — subnets, route tables, security groups (none of this exists on DigitalOcean App Platform, which abstracts it away)
2. **IAM roles and policies** — ECS task execution role, permissions for Secrets Manager, CloudWatch
3. **Secrets management** — move `.env` variables to AWS Secrets Manager or Parameter Store (~$0.40/secret/month)
4. **CI/CD pipeline** — DigitalOcean App Platform auto-deploys on git push; AWS requires CodePipeline + CodeBuild or GitHub Actions with AWS CLI deploy steps
5. **Domain & SSL** — Route 53 (optional, ~$0.50/month per hosted zone) + ACM certificate (free) vs DigitalOcean's built-in domain handling
6. **Monitoring** — CloudWatch Dashboards/Alarms need manual setup vs DigitalOcean's built-in metrics view
7. **Learning curve** — team needs working knowledge of ECS, VPC networking, IAM — not required with current stack

**Estimated one-time migration effort:** 3-7 days depending on chosen AWS service (EC2 fastest, Fargate with private subnet slowest).

---

## Final Recommendation

### For current MVP stage: **Stay on DigitalOcean + Supabase**

Reasons:
- AWS costs **55-160% more** for equivalent compute at this scale once NAT Gateway, ALB, and hidden charges are included
- DigitalOcean App Platform's git-push deploy and built-in SSL/scaling save real engineering time the team doesn't need to spend right now
- No AWS-specific expertise required to maintain current stack

### When to revisit AWS:

| Trigger | Why |
|---------|-----|
| User base exceeds 10,000+ premium users | At higher scale, AWS Reserved Instances / Savings Plans and bin-packing efficiency narrow the cost gap |
| Need for AWS-specific services | E.g., SageMaker for ML features, Rekognition, or other AWS-only tooling |
| Company-wide AWS standardization | If parent company/investor requires consolidated AWS billing |
| Need for multi-region deployment | AWS's global infrastructure is more mature for this than DigitalOcean |

### If moving to AWS anyway, cheapest viable path:

```
ECS Fargate, public subnet (no NAT), keep Supabase:  ~$70.62/month
   OR
EC2 t4g.small Reserved Instance, keep Supabase:        ~$44-46/month
```

The EC2 path is cost-competitive with the current DigitalOcean setup but trades managed simplicity for manual server administration (patching, deployment scripts, process management).

---

**Document version:** 1.0
**Last updated:** June 18, 2026
**Status:** Analysis complete — recommendation: stay on current stack for MVP phase
