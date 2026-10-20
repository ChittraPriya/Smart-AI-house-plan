# Security Specification for HomeAI Firestore Rules

## 1. Data Invariants
- A UserProfile can only be read, created, or updated by the authenticated user whose `request.auth.uid == userId`.
- A HousePlan can only be created by an authenticated user where `incoming().userId == request.auth.uid`.
- A HousePlan can only be updated or deleted by its verified owner (`existing().userId == request.auth.uid`).
- Fields `id`, `userId`, and `createdAt` are immutable after creation.
- Strict length and type constraints are enforced on all fields to prevent denial-of-wallet resource attacks.
- Default deny catches any unspecified paths.

## 2. The "Dirty Dozen" Threat Scenarios
1. Unauthenticated write to `/plans/{planId}` -> DENIED
2. Authenticated user A attempting to overwrite user B's plan -> DENIED
3. User attempting to spoof another user's UID in `userId` -> DENIED
4. User attempting to mutate immutable `userId` on update -> DENIED
5. Attacker attempting to inject >50KB payload in `layoutJson` -> DENIED
6. Attacker querying all plans without filtering by own `userId` -> DENIED
7. User attempting to write invalid plot dimensions (< 5ft or > 1000ft) -> DENIED
8. Unauthenticated read to `/users/{userId}` -> DENIED
9. Malicious path injection with non-alphanumeric ID -> DENIED
10. Unauthenticated deletion of plans -> DENIED
11. User trying to write to non-existent collection -> DENIED
12. Attempt to bypass schema with unknown arbitrary ghost fields -> DENIED
