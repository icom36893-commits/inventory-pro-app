@echo off
chcp 65001 >nul
title Makhzan.Pro.Server
echo =======================================================
echo       Makhzan.Pro.Server (Local Network Server)
echo =======================================================
echo Starting the server in background mode...
echo Do not close this window to keep the server running.
echo =======================================================
echo اسم الكمبيوتر (الحل الدائم):
echo [93m[ %COMPUTERNAME% ][0m
echo نوصي باستخدام اسم الكمبيوتر بدلاً من الـ IP لأنه لا يتغير حتى لو تم إعادة تشغيل المودم (الراوتر). انسخ هذا الاسم وضعه في الجهاز الفرعي.
echo =======================================================
set SERVER_ONLY=true
npm run dev
pause