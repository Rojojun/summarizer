# Git-Summerizer CLI (Beta)

GitLab Merge Request를 AI로 분석하여 한국어 요약을 생성하는 CLI 도구입니다.

[![npm version](https://badge.fury.io/js/git-summerizer.svg)](https://badge.fury.io/js/git-summerizer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 특징

- **AI 기반 분석**: Gemini AI를 활용한 코드 변경사항 분석
- **한국어 지원**: 완전한 한국어 인터페이스 및 분석 결과 제공
- **GitLab 전용**: GitLab Merge Request 전문 분석 도구
- **대화형 CLI**: 직관적인 프로젝트 및 MR 선택 인터페이스
- **상세 분석**: 커밋, 파일 변경사항, 코드 리뷰 종합 분석

## 시작하기

### 설치

```bash
npm install -g git-summerizer
```

#### GitLab 액세스 토큰 생성

1. GitLab에서 Settings → Access Tokens로 이동
2. Personal Access Token 생성
3. 다음 권한 선택:
    - `api` (전체 API 접근)
    - `read_repository` (저장소 읽기)
    - `read_user` (사용자 정보 읽기)

### 기본 사용법

```bash
git-summerizer
```

CLI를 실행하면 대화형 인터페이스가 시작됩니다:

1. **프로젝트 선택**: GitLab 프로젝트를 검색하고 선택
2. **MR 상태 필터**: Opened/Closed/Merged/All 중 선택
3. **MR 선택**: 분석할 Merge Request 선택
4. **분석 옵션 선택**: AI 분석 또는 상세 정보 보기

## 주요 기능

### 1. 프로젝트 검색 및 선택

- **페이지네이션**: 대량의 프로젝트를 페이지별로 탐색
- **실시간 검색**: 프로젝트명, 네임스페이스, 설명으로 검색
- **활동 기반 정렬**: 최근 활동 순으로 정렬된 프로젝트 목록
- **상세 정보**: 스타 수, 포크 수, 최근 활동 시간 표시

### 2. Merge Request 관리

- **상태별 필터링**: 열린/닫힌/병합된 MR 분류
- **상세 메타데이터**: 작성자, 생성일, 업데이트일, 댓글 수
- **브랜치 정보**: Source → Target 브랜치 표시
- **페이지네이션**: 대량의 MR을 효율적으로 탐색

### 3. AI 분석 (Gemini)

- **종합 분석**: 커밋 히스토리 + 파일 변경사항 + 코드 리뷰 통합 분석
- **한국어 요약**: 변경사항을 이해하기 쉬운 한국어로 요약
- **코드 품질 평가**: 변경사항의 품질과 영향도 분석
- **리뷰 포인트 제안**: 코드 리뷰 시 주의할 점 제안

### 4. 상세 정보 보기

#### 커밋 히스토리
- 커밋 메시지, 작성자, 날짜
- Short SHA와 상세 설명
- 시간순 정렬된 변경 이력

#### 파일 변경사항
- 추가/수정/삭제/이름변경된 파일 통계
- 파일별 변경 상태 표시
- 대량 변경사항의 요약 정보

#### 코드 리뷰 및 댓글
- 리뷰어의 댓글과 피드백
- 작성자별 의견 정리
- 시간순 댓글 히스토리

## Beta 버전 제한사항

### 현재 지원 기능
- ✅ GitLab 전용 (GitLab API v4)
- ✅ 한국어 인터페이스
- ✅ Merge Request 분석
- ✅ AI 기반 요약 (Gemini)

### 향후 계획
- 🔄 GitHub 지원 예정
- 🔄 영어 인터페이스 추가 예정
- 🔄 Pull Request 분석 지원 예정
- 🔄 다국어 AI 분석 지원 예정

## 문제 해결

### GitLab 인증 오류

```bash
Error: 401 Unauthorized
```

**해결 방법:**
1. GitLab Access Token이 유효한지 확인
2. 토큰에 `api`, `read_repository` 권한이 있는지 확인
3. GitLab URL이 정확한지 확인 (trailing slash 제거)

### Gemini API 오류

```bash
Error: Failed to generate AI analysis
```

**해결 방법:**
1. 네트워크 연결 상태 확인
2. 이슈에 등록하여 문제 해결 요청하기

## 기여하기

Git-Summerizer는 오픈소스 프로젝트입니다. 기여를 환영합니다!

### 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/your-username/git-summerizer.git
cd git-summerizer

# 의존성 설치
npm install

# 빌드
npm run build

# 로컬 테스트
npm link
```

## 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 지원

- **GitHub Issues**: [Issue 생성](https://github.com/Rojojun/summarizer/issues)
- **Documentation**: [GitHub Wiki](https://github.com/Rojojun/summarizer/wiki)
- **Email**: zoloman316@gmail.com

---

**Made with ❤️ by Rojojun**

*이 도구는 Beta 버전입니다. 프로덕션 환경에서 사용 시 충분한 테스트를 거쳐주세요.*