# むすび

令和8年熊本地震をきっかけに開発した、行政・災害ボランティア向けのオープンソース災害支援マッチングシステムです。

被災した方からの匿名支援要請、運営者による確認、ボランティアへの割当、対応状況の追跡を一つの地図上で扱います。SNSを置き換えるのではなく、散在する情報を行政や支援団体が判断できる形へ整える「共通作戦図」を目指しています。

## 大切な注意

- このリポジトリは熊本県、熊本市、気象庁その他の行政機関による公式サービスではありません。
- 命に関わる緊急事態では本システムを使用せず、119または110へ通報してください。
- 実運用には、自治体、社会福祉協議会、災害支援団体など、責任を持つ運用主体が必要です。
- 個人情報を扱う前に、利用地域の法令、個人情報保護方針、保存期間、権限管理、インシデント対応を定めてください。
- 管理者権限は担当者ごとに付与し、共有アカウントを使用しないでください。

## 主な機能

- アカウント不要の匿名支援要請
- 受付番号による状況確認マイページ
- 公開位置と正確な位置・連絡先の分離
- Googleログインによる個人アカウント認証
- 行政組織・担当者ごとの役割分離と監査履歴
- 支援要請の確認、割当、対応履歴
- MapLibreによる地図表示
- AIで収集したSNS情報の「未確認」表示
- モバイルファーストUI
- 端末言語を初期判定する日本語・英語表示切替
- 将来のPWA対応を想定したApp Router構成

## 技術構成

- Next.js App Router
- TypeScript
- Supabase Auth / PostgreSQL / Row Level Security
- MapLibre GL JS
- Tailwind CSS
- Vercel

## ローカル起動

Node.js 22以降が必要です。

```bash
git clone https://github.com/fedlic/musubi-disaster-support.git
cd musubi-disaster-support
npm install
cp .env.example .env.local
npm run dev
```

`http://localhost:3000` を開きます。

## Supabaseの準備

1. Supabaseで新しいプロジェクトを作成します。
2. SQL Editorで `supabase/schema.sql` を実行します。
3. `.env.local` に以下を設定します。

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAIL_ALLOWLIST=
INTAKE_HASH_SALT=
X_API_BEARER_TOKEN=
```

`SUPABASE_SERVICE_ROLE_KEY` はサーバー環境だけに保存し、ブラウザやGitへ公開しないでください。

## Googleログインの準備

1. Google Cloud Consoleでウェブアプリ用のOAuthクライアントを作成します。
2. Supabase DashboardのAuthentication > Providers > GoogleへClient IDとClient Secretを登録します。
3. Google側の承認済みリダイレクトURIへ、Supabase Dashboardに表示されるCallback URLを登録します。
4. SupabaseのRedirect URLsへローカルと本番URLの `/auth/callback` を登録します。

Googleで初めてログインした利用者は一般利用者として登録されます。管理画面を利用させる場合は、運営責任者が `organizations` と `staff_memberships` に所属・役割を登録してください。Googleのプロフィール情報から管理者権限を自己設定することはできません。

担当者ロールは次の5種類です。

- `super_admin`: システム全体の管理
- `municipal_admin`: 自治体内の担当者・権限管理
- `coordinator`: 支援調整と承認
- `dispatcher`: ボランティア・車両等の割当
- `viewer`: 閲覧のみ

## Vercelへのデプロイ

1. このリポジトリを自分のGitHubアカウントへForkします。
2. VercelでForkしたリポジトリをImportします。
3. Supabaseの環境変数をVercelへ登録します。
4. `main` ブランチをデプロイします。

## 別の災害・地域で使う

以下を地域の状況に合わせて変更してください。

- サービス名と対象災害名
- 地図の中心座標
- 公式情報へのリンク
- 支援カテゴリと優先度
- 運用主体と管理者メール
- 個人情報の保存期間
- ボランティア登録・本人確認手順

災害時に独立した非公式窓口を乱立させると、支援要請の分散や取りこぼしにつながります。可能な限り自治体、社会福祉協議会、災害支援団体と調整し、既存の公式窓口を補完する形で導入してください。

## 開発への参加

IssueとPull Requestを歓迎します。セキュリティや個人情報に関わる問題は、公開Issueへ実データを投稿せず、リポジトリ所有者へ非公開で連絡してください。

## ライセンス

MIT Licenseです。誰でも利用、改変、再配布できます。詳細は `LICENSE` を参照してください。
