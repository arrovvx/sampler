@echo off
@set dockerhostIP=%1
@if NOT [%1]==[] goto skipdefault
@rem @set /p "dockerhostIP=Please Enter Docker IP:"
@set ip_address_string="IPv4 Address"
echo Getting Docker IP
for /f "skip=1 usebackq tokens=2 delims=:" %%f in (`ipconfig ^| findstr /c:%ip_address_string%`) do (
	rem echo IP Address: %%f
	set dockerhostIP=%%f
	goto :skipdefault
)
:skipdefault
echo Docker Host IP:%dockerhostIP%
docker run -p 27017:27017 --name mongodb -d arrovvx/mongodb:default 2>nul
docker stop controller >nul 2>nul
docker rm controller >nul 2>nul
docker pull arrovvx/controller:latest
docker run -d -p 9080:9080 -p 9081:9081 -p 8888:8888 -p 8889:8889 --name controller --add-host dockerhost:"%dockerhostIP%" arrovvx/controller
npm start

