# DATA PRESERVATION AND DEPLOYMENT RULES

1. **NO DATA LOSS**: Never drop, wipe, truncate, or overwrite existing database records in PostgreSQL.
2. **SAFE MIGRATION**: Always register new columns in `backend/app/main.py` using `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
3. **MANDATORY DEPLOY COMMANDS**: Always provide the 3-step push & deploy command block at the end of every response.
   - `git push origin master`
   - `ssh root@202.155.157.22`
   - `cd /opt/sempoa-sip && bash deploy.sh`
