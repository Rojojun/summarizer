const esbuild = require('esbuild');
const dotenv = require('dotenv');

// .env 파일 로드
dotenv.config();

// 환경 변수 확인
const geminiApiUrl = process.env.GEMINI_QUEUE_SERVER_API;

if (!geminiApiUrl) {
    console.warn('Warning: GEMINI_QUEUE_SERVER_API not found in environment variables');
    console.warn('The built package will require users to set this environment variable');
}

console.log('Building with esbuild...');
console.log(`GEMINI_QUEUE_SERVER_API: ${geminiApiUrl ? '✓ Set' : '✗ Not set'}`);

esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outdir: 'dist',
    format: 'cjs',
    banner: {
        js: '#!/usr/bin/env node',
    },
    // 환경 변수를 코드에 주입
    define: {
        'process.env.GEMINI_QUEUE_SERVER_API': geminiApiUrl
            ? JSON.stringify(geminiApiUrl)
            : 'process.env.GEMINI_QUEUE_SERVER_API',
    },
    // dependencies를 번들에 포함하지 않음 (사용자가 npm install로 설치)
    external: [
        'axios',
        'chalk-animation',
        'clipboardy',
        'dotenv',
        'inquirer',
        'ora',
        'gradient-string',
    ],
    minify: false,
    sourcemap: false,
}).then(() => {
    console.log('✓ Build completed successfully!');
}).catch((error) => {
    console.error('✗ Build failed:', error);
    process.exit(1);
});