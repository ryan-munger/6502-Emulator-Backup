@echo off
if not exist "dist" (
  rem dist folder does not exist, create.
  mkdir dist
  echo Created dist directory
)

call tsc --version
echo Starting TypeScript compile
call tsc --rootDir src/ --outDir dist/
rem npm start will start the system and execute program set in system.ts

echo.
echo Starting System
npm start
