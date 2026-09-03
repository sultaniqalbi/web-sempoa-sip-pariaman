# Deployment Format Rule

Whenever finishing a task, writing code, or making changes, Antigravity MUST output the exact following block to give the user the push and deploy commands.

Format strictly like this:

🚀 Deploy ke VPS Sekarang:
```bash
git add .
git commit -m "[Deskripsi perubahan]"
git push origin master
```
```bash
ssh root@202.155.157.22
```
```bash
cd /opt/sempoa-sip
bash deploy.sh
```
