# Festly Documentation

This directory contains comprehensive documentation for the Festly project.

## Documents

### [Festly Marketplace Build Plan](./festly-marketplace-build-plan.md)

**Primary implementation guide for Phase 1 marketplace.**

This document contains:
- Complete database schema with all tables, relationships, and RLS policies
- Detailed project structure (Landing page vs. App separation)
- Authentication & authorization flows
- Pricing engine design and implementation
- Cal.com-style scheduling system
- Job workflow and status transitions
- Google Maps API integration for distance calculation
- File upload system (Supabase Storage)
- UI design system (Festly color palette + ShadCN)
- Complete page and route structure
- Component breakdown with specs
- Phase-by-phase implementation roadmap
- Future hooks for: drawing tool, Stripe, messaging, credibility system

**Use this document as the single source of truth when implementing the marketplace.**

---

## Project Overview

### Current State: Waitlist Feature (Separate from Marketplace)

The project currently has a working waitlist feature:
- **Location:** Root URL (`/`) and `/waitlist-signin`
- **UI:** Built with Untitled UI components
- **Database:** `waitlist` table in Supabase
- **Purpose:** Collect early user signups before marketplace launch

**This feature will remain separate from the marketplace and continue to function independently.**

---

### Phase 1: Marketplace Implementation (In Progress)

The marketplace is a complete job management platform for Christmas light installation:

**Key Features:**
- Role-based authentication (Homeowner, Contractor, Admin)
- Job creation with automated pricing
- Contractor availability scheduling (Cal.com-style)
- Tinder/Uber-style job feed for contractors
- Distance-based job matching
- Job status tracking from creation to completion
- Photo uploads for job references

**Architecture:**
- **Landing Pages** (`/`, `/waitlist-signin`): Continue using Untitled UI
- **App Pages** (`/app/*`, `/auth/*`): Built with ShadCN UI
- **Separation:** Clean separation between marketing/waitlist and authenticated app

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:**
  - Landing: Untitled UI + React Aria Components
  - App: ShadCN UI
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Maps:** Google Maps API
- **Deployment:** Vercel

---

## Getting Started with Implementation

1. **Read the [Build Plan](./festly-marketplace-build-plan.md)** thoroughly
2. **Follow the implementation phases** in order (Phase 0 → Phase 5)
3. **Refer back to the plan** for schema definitions, component specs, and status flows
4. **Keep landing and app UI separate** (Untitled UI vs. ShadCN)

---

## Relationship Between Waitlist and Marketplace

**Waitlist:**
- Pre-launch feature to collect emails
- Separate from marketplace functionality
- Will be used to invite beta users once marketplace launches

**Marketplace:**
- Main product (Christmas light installation platform)
- Accessible after user signs up and completes onboarding
- Separate routes and UI from waitlist

**Future:** Waitlist users will receive email invitations to create marketplace accounts and become beta testers.

---

## Questions or Clarifications?

If anything in the build plan is unclear:
1. Check the relevant section in the build plan first
2. Look at database schema for data structure questions
3. Look at component breakdown for UI questions
4. Look at implementation phases for sequencing questions

---

**Last Updated:** January 9, 2025
