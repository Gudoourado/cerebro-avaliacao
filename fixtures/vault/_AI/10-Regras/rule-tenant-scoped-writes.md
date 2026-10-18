---
id: rule-tenant-scoped-writes
type: rule
status: approved
description: Toda escrita em dado multi-tenant filtra por tenantId no WHERE. Vale para update, delete e upsert.
keywords:
  - tenantId
  - multi-tenant
  - updateMany
  - IDOR
aliases:
  - isolamento de tenant
  - tenant isolation
scope: global
priority: must
updated: 2026-09-22
---
# Escritas multi-tenant

## Regra

Nunca execute update, delete ou upsert sem `tenantId` no WHERE.
