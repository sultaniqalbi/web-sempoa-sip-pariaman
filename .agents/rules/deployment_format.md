# Deployment Format Rule

Whenever finishing a task, writing code, or giving deployment instructions, Antigravity MUST output the deployment commands using this EXACT separated format. DO NOT use one-liner SSH commands like `ssh root@ip "cd /path && bash deploy.sh"`.

Gunakan format ini secara persis:

**1. Kode untuk Push ke GitHub (Jalankan di terminal lokal Anda terlebih dahulu):**
```bash
git add .
git commit -m "[Deskripsi perubahan]"
git push origin master
```

**2. Kode untuk Deploy di VPS (Jalankan setelah push di atas selesai):**
Masuk (login) ke servernya dulu:
```bash
ssh root@202.155.157.22
```

Kemudian di dalam VPS jalankan scriptnya:
```bash
cd /opt/sempoa-sip
bash deploy.sh
```
