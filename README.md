This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# 백엔드 API URL 설정
# 로컬 개발 환경
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**참고:**
- `.env.local.example` 파일을 참고하세요
- `.env.local` 파일은 `.gitignore`에 포함되어 GitHub에 올라가지 않습니다
- **배포 시에는 배포 플랫폼(Vercel, GCP 등)에서 환경 변수를 직접 설정해야 합니다**
  - 배포 플랫폼에서 `NEXT_PUBLIC_API_URL=https://dev.nvp.kr` 설정 필요
  - 자세한 내용은 `DEPLOYMENT.md` 참고

### 2. 개발 서버 실행

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## 환경 변수 설정

### 백엔드 API URL 관리

모든 API 호출은 `app/lib/api.ts`의 `getApiEndpoint()` 함수를 통해 중앙 관리됩니다.

- **로컬 개발**: `NEXT_PUBLIC_API_URL=http://localhost:8080`
- **배포 환경**: `NEXT_PUBLIC_API_URL=https://dev.nvp.kr`

환경 변수를 변경하면 모든 API 호출이 자동으로 새로운 URL을 사용합니다.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
