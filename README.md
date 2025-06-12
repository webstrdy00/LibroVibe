# 📚 LibroVibe - 베스트셀러 한눈에 보기

<div align="center">
  <img src="public/icon-128.png" alt="LibroVibe Logo" width="128" height="128">
  
  **교보문고, YES24, 알라딘의 주간 베스트셀러를 한 곳에서 비교하세요**
</div>

## ✨ 주요 기능

- 🔍 **원클릭 베스트셀러 확인**: 교보문고 주간 베스트 Top 10을 팝업에서 즉시 확인
- 📊 **3사 통합 비교**: 교보문고, YES24, 알라딘의 Top 100을 한 화면에서 비교
- 🔄 **자동 업데이트**: 6시간마다 자동으로 최신 순위 갱신
- 📈 **순위 변동 표시**: 전주 대비 순위 변화를 시각적으로 표현
- 🌙 **다크 모드**: 눈이 편안한 다크 테마 지원
- ⚡ **빠른 성능**: 가상 스크롤로 100개 항목도 부드럽게 표시

## 🛠️ 기술 스택

- **Frontend**: React 18, TypeScript, TailwindCSS
- **Build**: Vite, @crxjs/vite-plugin
- **State**: Zustand, TanStack Query
- **UI**: Headless UI, TanStack Virtual
- **Test**: Vitest, Testing Library

## 📦 설치 방법

### Chrome Web Store에서 설치 (권장)

1. [Chrome Web Store](https://chrome.google.com/webstore)에서 "LibroVibe" 검색
2. "Chrome에 추가" 클릭

### 개발자 모드로 설치

1. 이 저장소를 클론합니다:

   ```bash
   git clone https://github.com/webstrdy00/LibroVibe
   cd LibroVibe
   ```

2. 의존성을 설치합니다:

   ```bash
   npm install
   ```

3. 빌드합니다:

   ```bash
   npm run build
   ```

4. Chrome 확장 프로그램 관리 페이지 열기:
   - 주소창에 `chrome://extensions` 입력
   - "개발자 모드" 활성화
   - "압축해제된 확장 프로그램을 로드합니다" 클릭
   - `dist` 폴더 선택

## 🚀 사용 방법

1. **빠른 확인**: 브라우저 툴바의 LibroVibe 아이콘을 클릭하여 교보문고 Top 10 확인
2. **전체 순위**: "더 많은 순위 확인하기" 버튼으로 3사 통합 비교 페이지 열기
3. **서점 전환**: 상단 탭으로 교보문고/YES24/알라딘 간 전환
4. **상세 정보**: 책 카드를 클릭하면 해당 서점의 상세 페이지로 이동

## ⚙️ 설정

확장 프로그램 아이콘 우클릭 → "옵션"에서 설정 가능:

- **자동 새로고침 주기**: 3시간 / 6시간 / 12시간
- **다크 모드**: 켜기 / 끄기
- **언어**: 한국어 (영어, 일본어 추가 예정)

## 🧑‍💻 개발

### 개발 환경 설정

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 테스트 실행
npm test

# 린트 실행
npm run lint

# 포맷팅
npm run format
```

### 프로젝트 구조

```
LibroVibe/
├── src/
│   ├── background/      # Service Worker
│   ├── popup/          # 팝업 UI
│   ├── pages/          # 전체 페이지
│   │   └── ranks/      # 베스트셀러 비교 페이지
│   ├── options/        # 설정 페이지
│   ├── components/     # 공통 컴포넌트
│   ├── parsers/        # 서점별 파서
│   ├── styles/         # 전역 스타일
│   └── types/          # TypeScript 타입
├── public/
│   └── icons/          # 확장 프로그램 아이콘
├── manifest.json       # 확장 프로그램 매니페스트
└── vite.config.ts      # Vite 설정
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📋 로드맵

- [x] v0.1 - MVP 출시
- [ ] v0.2 - 분야별 베스트셀러 지원
- [ ] v0.3 - 순위 변동 그래프
- [ ] v0.4 - 다국어 지원 (영어, 일본어)
- [ ] v1.0 - Firefox 확장 프로그램

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🙏 감사의 말

- 베스트셀러 데이터를 제공하는 교보문고, YES24, 알라딘
- 오픈소스 커뮤니티의 모든 기여자들

## 📞 문의

- 이슈: [GitHub Issues](https://github.com/webstrdy00/LibroVibe/issues)
- 이메일:

---
