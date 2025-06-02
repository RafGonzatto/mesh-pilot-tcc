@echo off
echo 🔧  Compilando geometry.c → geometry_wasm.*
emcc src\wasm\geometry.c -O3 ^
 -s MODULARIZE=1 ^
 -s EXPORT_NAME=GeometryModule ^
 -s ENVIRONMENT=web ^
 -s EXPORTED_FUNCTIONS="['_segments_intersect']" ^
 -o dist\geometry_wasm.js
