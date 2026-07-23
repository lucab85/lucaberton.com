# GPU Cost Calculator — 3-Email Nurture Sequence

> Ready to paste into MailerLite. Set up as automation triggered when someone
> submits the GPU Cost Calculator lead capture form.

---

## Email 1 — Day 0 (Immediate)
**Subject:** Your GPU cost breakdown is ready
**Preview:** Plus the #1 mistake I see teams make with GPU spend

---

Hi {$name|there},

Thanks for using the GPU Cost Calculator — here's a quick summary of what the numbers are telling you.

**The pattern I see in every engagement:**

Most teams overspend on GPU compute by 40–60%. Not because they picked the wrong GPU — but because of three things:

1. **Utilization is lower than they think.** Teams estimate 70% utilization. Reality is usually 30–45%. Those idle GPUs still cost money.

2. **Training and inference need different hardware.** Running inference on H100s is like commuting in a Ferrari — technically works, financially insane.

3. **Nobody models the "other" costs.** Storage, egress, orchestration overhead, and engineering time add 25–40% on top of raw compute.

The calculator gives you directional numbers. For a precise model — one that accounts for your actual workload patterns, vendor quotes, and commitment options — that's what I do in my [Assessment engagements](https://lucaberton.com/services/automation-strategy/).

**One quick action you can take today:**

Check your actual GPU utilization over the last 30 days. If you're on Kubernetes, run:

```
kubectl top nodes -l nvidia.com/gpu.present=true
```

Compare that number to what you entered in the calculator. The gap is your savings opportunity.

Talk soon,

**Luca Berton**
AI & Cloud Advisor
[lucaberton.com](https://lucaberton.com/) · [LinkedIn](https://www.linkedin.com/in/lucaberton/)

P.S. — I also wrote a deep-dive on [automating GPU cluster provisioning with Ansible](https://lucaberton.com/blog/ansible-gpu-cluster-provisioning/) if you're looking at on-prem options.

---

## Email 2 — Day 3
**Subject:** How one team cut GPU costs by 52% (without reducing capacity)
**Preview:** The RHEL AI + MIG setup that changed everything

---

Hi {$name|there},

Quick story from a recent engagement.

A financial services company was running inference on 16× A100-80GB across two cloud providers. Monthly bill: **$58K**.

After a 2-week assessment, we made three changes:

**1. Split training from inference hardware**
Training stayed on A100-80GB (they needed the VRAM for fine-tuning). Inference moved to L40S — 60% cheaper per GPU-hour, and their latency SLAs were still met.

**2. Implemented MIG partitioning with RHEL AI**
Each A100 was sliced into 3× 26GB instances using NVIDIA MIG. Three teams sharing one GPU instead of each getting their own. Utilization jumped from 35% to 85%.

**3. Automated provisioning with Ansible**
No more 3-day lead time for GPU environments. New GPU workspaces spin up in 12 minutes with a single playbook. I wrote about the exact patterns in my [GPU cluster provisioning guide](https://lucaberton.com/blog/ansible-gpu-cluster-provisioning/).

**Result:** $58K/month → $28K/month. Same workloads. Same SLAs.

The spreadsheet model I used for the analysis is similar to the [GPU Cost Calculator](https://lucaberton.com/gpu-cost-calculator/) you tried — but tuned to their specific vendor contracts and commitment discounts.

If you're spending more than $10K/month on GPU compute, there's almost certainly a 30%+ savings opportunity. I can usually spot it in a single discovery call.

→ [Book 30 minutes](https://lucaberton.com/contact/) — no pitch, just analysis.

Luca

---

## Email 3 — Day 7
**Subject:** Your GPU roadmap for the next 12 months
**Preview:** 3 decisions to make before your next renewal

---

Hi {$name|there},

Last email in this series — I want to leave you with a practical framework.

**Three GPU decisions you need to make in the next 90 days:**

### 1. Commit or stay on-demand?

Cloud GPU reserved instances save 40–60% — but lock you in for 1–3 years. The question isn't "should we commit?" — it's "how much of our baseline load is stable enough to commit?"

Rule of thumb: commit on inference (predictable), stay flexible on training (spiky).

### 2. Cloud, on-prem, or hybrid?

If your GPU spend exceeds $15K/month and your workload is consistent, on-prem breaks even in 14–18 months. Below that, cloud is almost always cheaper when you factor in ops overhead.

The sweet spot for most teams: on-prem for inference + cloud burst for training. [RHEL AI](https://lucaberton.com/blog/ansible-rhel-ai-platform-deployment/) makes the on-prem side manageable.

### 3. Right-size before you scale

Before adding GPUs, check if you're using the ones you have. Most teams I work with can handle 2× the workload on the same hardware by:
- Implementing [MIG partitioning](https://lucaberton.com/blog/ansible-gpu-cluster-provisioning/) for multi-tenancy
- Optimizing batch sizes and model quantization
- Using [vLLM](https://lucaberton.com/blog/ansible-rhel-ai-platform-deployment/) for inference (3–5× throughput vs naive serving)

**What I offer:**

A 2-week **GPU Infrastructure Assessment** where I model your actual workloads, benchmark your current setup, and deliver a concrete optimization plan with projected savings.

Past assessments have identified $180K–$420K in annual savings for mid-size ML teams.

→ [Let's talk](https://lucaberton.com/contact/)

Best,

**Luca Berton**
AI & Cloud Advisor · KubeCon EU & Red Hat Summit 2026 Speaker
[lucaberton.com](https://lucaberton.com/) · [Ansible Pilot](https://www.ansiblepilot.com/) · [Open Empower](https://www.openempower.com/)

---

## MailerLite Setup Notes

- **Trigger:** Form submission (GPU Cost Calculator page)
- **Delays:** Email 1 = immediate, Email 2 = 3 days, Email 3 = 7 days
- **Group/Tag:** `gpu-calculator-leads`
- **Goal:** Click on `/contact/` link (marks conversion)
- **Remove from sequence if:** Books a call (manual tag or Calendly webhook)
