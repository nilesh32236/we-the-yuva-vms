---
title: WeTheYuva API
emoji: 🌿
colorFrom: green
colorTo: green
sdk: docker
app_port: 4000
pinned: false
---

# WeTheYuva VMS — API

Node.js + Express REST API for the WeTheYuva Volunteer Management System.

## Dev OTP (Testing)

When `ALLOW_DEV_OTP=true` (testing/staging only — NEVER production):

- `/auth/send-otp` returns the generated OTP as `devOtp` in the response **even if SMTP/Resend is configured**, so seeded users without a real inbox can log in.
- The universal OTP `000000` is accepted for **any** email (login, verify, etc.).
- When `ALLOW_DEV_OTP` is unset/false, behavior is unchanged: a real email is sent and `devOtp` is only returned when no email transport is configured.

To display the dev OTP in the frontend UI, the frontend must also set `NEXT_PUBLIC_DEV_OTP=true` (see `frontend/.env`).

Set `ALLOW_DEV_OTP=true` in the Hugging Face Space env vars (or `backend/.env` for local dev) alongside the SMTP variables.


