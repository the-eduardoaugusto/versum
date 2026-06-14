# Incident Response Plan

DPO: dpo@versum.app | LGPD notification deadline: 2 business days (Art. 48)

## Classification
| Level | Description | SLA |
|-------|-------------|-----|
| Low | No personal data exposure | 24h investigate |
| Medium | Limited non-sensitive exposure | 12h contain |
| High | Identifiable data exposed | 4h contain |
| Critical | Massive sensitive data exposure | Immediate |

## Personal Data Breach
Accidental/unlawful destruction, loss, alteration, unauthorized disclosure, or unauthorized access to personal data.

## Flow

**Detection**
- Automated: rate limit exceeded | auth 500 | invalid token attempts
- Manual: user/partner reports | log audit

**Triage (30 min)**
1. Confirm personal data involved
2. Classify level
3. Notify DPO if ≥ Medium
4. Open incident record

**Containment (2h–24h)**
- Isolate affected systems (Engineering)
- Rotate compromised keys/tokens (Engineering)
- Block malicious IPs (DevOps)
- Forensic snapshot (logs + DB) (Engineering)

**Investigation (48h)**
- Root cause | data scope | affected users | timeline

**Notification (2 business days)**
- ANPD: data nature, breach circumstances, containment, risks, DPO contact
- Users (if required): incident desc, affected data, measures, recommendations

## ANPD Template
```
Subject: Personal Data Breach Notification — Versum
Incident date: [DATE] | Notification date: [DATE]
1. Description: [what happened / how detected]
2. Data types: [email, name, IP, etc.]
3. Affected subjects: [approx. N users]
4. Root cause: [cause] | Breach: [timestamp] | Detection: [timestamp] | System: [system]
5. Containment: [actions taken]
6. Risks: [risks to data subjects]
7. DPO: dpo@versum.app
```

## Automated Alerts (Discord Webhook)
Triggers: multiple failed logins | invalid token attempts | auth 500
Payload: timestamp + requester IP + route + error code

## Post-Incident
1. Root cause analysis (post-mortem)
2. Implement corrective measures
3. Update this plan
4. Archive final report
