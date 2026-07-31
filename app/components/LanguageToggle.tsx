"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Locale = "ja" | "en";

const translations: Record<string, string> = {
  "令和8年熊本地震 支援情報システム": "2026 Kumamoto Earthquake Support System",
  "災害対応中": "Emergency response active",
  "Googleログイン": "Sign in with Google",
  "安全な個人認証": "Secure personal account",
  "マイページ": "My page",
  "熊本県内 災害対応": "Kumamoto disaster response",
  "令和8年熊本地震": "2026 Kumamoto Earthquake",
  "登録要請": "Requests",
  "公開範囲": "Public",
  "公式情報": "Official information",
  "掲載中": "Published",
  "未確認情報": "Unverified information",
  "要確認": "Needs verification",
  "対象災害": "Disaster",
  "最大震度7": "Maximum intensity 7",
  "気象庁発表": "JMA report",
  "＋ 支援を要請する": "+ Request support",
  "＋ 支援を要請": "+ Request support",
  "対応状況": "Response status",
  "すべて": "All",
  "緊急": "Urgent",
  "未割当": "Unassigned",
  "公式": "Official",
  "優先": "Priority",
  "対応中": "In progress",
  "未確認": "Unverified",
  "公開位置は概略表示": "Public location is approximate",
  "必要な支援": "Support needed",
  "状況": "Situation",
  "個人情報は認可された災害対策担当者だけが管理画面で確認できます":
    "Personal information is visible only to authorized disaster response staff.",
  "公式発表": "Official announcement",
  "AI収集情報・未確認": "AI-collected information · Unverified",
  "対応履歴": "Activity history",
  "要請を受信": "Request received",
  "内容を一次確認": "Initial review",
  "管理者画面で確認": "View in admin console",
  "ログインして支援に参加": "Sign in to volunteer",
  "匿名で送信できます": "No account required",
  "支援を要請する": "Request support",
  "場所・目印": "Location / landmark",
  "支援の種類": "Type of support",
  "対象人数": "Number of people",
  "要請の要約": "Request summary",
  "詳しい状況": "Details",
  "連絡方法（任意・非公開）": "Contact method (optional, private)",
  "安全に要請を送信": "Send request securely",
  "仕様・想い・使い方": "About and how to use",
  "公開マップへ戻る": "Back to public map",
  "管理者画面": "Admin console",
  "Googleアカウントでログイン": "Sign in with your Google account",
  "ボランティア": "Volunteer",
  "行政・運営担当者": "Government / operations staff",
  "対応状況へ戻る": "Back to response map",
  "支援要請の状況": "Support request status",
  "別の受付番号を追加": "Add another request ID",
  "受付番号": "Request ID",
  "状況を確認して保存": "Check and save",
  "登録ボランティアの方": "For registered volunteers",
  "Googleでログイン": "Sign in with Google",
  "端末内だけに保存": "Stored on this device only",
};

const placeholders: Record<string, string> = {
  "例：熊本市西区春日、○○公民館付近": "e.g. Near a community center in Nishi Ward, Kumamoto",
  "例：高齢者世帯に飲料水が必要": "e.g. Drinking water needed for an elderly household",
  "危険箇所、必要な物、移動できるか等": "Hazards, supplies needed, and whether evacuation is possible",
  "電話番号または連絡不要": "Phone number, or state that no contact is needed",
};

export default function LanguageToggle() {
  const pathname = usePathname();
  const [locale, setLocale] = useState<Locale>("ja");

  useEffect(() => {
    const saved = localStorage.getItem("musubi-locale") as Locale | null;
    const initial = saved ?? (navigator.language.toLowerCase().startsWith("ja") ? "ja" : "en");
    queueMicrotask(() => setLocale(initial));
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem("musubi-locale", locale);

    function translateDocument() {
      const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node = textWalker.nextNode();
      while (node) {
        const element = node.parentElement;
        if (element && !["SCRIPT", "STYLE"].includes(element.tagName)) {
          const original = element.dataset.jaText ?? node.textContent?.trim();
          if (original && translations[original]) {
            element.dataset.jaText = original;
            node.textContent = locale === "en" ? translations[original] : original;
          }
        }
        node = textWalker.nextNode();
      }

      document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[placeholder]").forEach((field) => {
        const original = field.dataset.jaPlaceholder ?? field.placeholder;
        if (placeholders[original]) {
          field.dataset.jaPlaceholder = original;
          field.placeholder = locale === "en" ? placeholders[original] : original;
        }
      });
    }

    translateDocument();
    const observer = new MutationObserver(() => translateDocument());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [locale, pathname]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <div className="language-toggle" role="group" aria-label="Language">
      <button className={locale === "ja" ? "active" : ""} onClick={() => setLocale("ja")}>日本語</button>
      <button className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>English</button>
    </div>
  );
}
