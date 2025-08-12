import React from "react";
import { Footer } from "@/components/KouchouAI/Footer";
import { Header } from "@/components/KouchouAI/Header";
import { Analysis } from "@/components/KouchouAI/report/Analysis";
import { BackButton } from "@/components/KouchouAI/report/BackButton";
import { ClientContainer } from "@/components/KouchouAI/report/ClientContainer";
import { Overview } from "@/components/KouchouAI/report/Overview";
import { Reporter } from "@/components/KouchouAI/reporter/Reporter";
import type { Meta, Report, Result } from "@/type";
import { ReportVisibility } from "@/type";
import { Box, Separator } from "@chakra-ui/react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getApiBaseUrl } from "../utils/api";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

// ISR 5分おきにレポート更新確認
export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const response = await fetch(`${getApiBaseUrl()}/reports`, {
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_PUBLIC_API_KEY || "",
        "Content-Type": "application/json",
      },
    });
    const reports: Report[] = await response.json();
    const slugs = reports
      .filter((report) => report.status === "ready")
      .map((report) => ({
        slug: report.slug,
      }));

    if (process.env.BUILD_SLUGS) {
      const buildSlugs = process.env.BUILD_SLUGS.split(",").filter(Boolean);
      return slugs.filter((report) => buildSlugs.includes(report.slug));
    }

    return slugs;
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const slug = (await params).slug;
    const metaResponse = await fetch(`${getApiBaseUrl()}/meta/metadata.json`, {
      next: { tags: ["meta"] } as any,
    });
    const resultResponse = await fetch(`${getApiBaseUrl()}/reports/${slug}`, {
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_PUBLIC_API_KEY || "",
        "Content-Type": "application/json",
      },
      next: { tags: [`report-${slug}`] } as any,
    });
    if (!metaResponse.ok || !resultResponse.ok) {
      return {};
    }

    const { getBasePath } = await import("@/app/utils/image-src");

    const meta: Meta = await metaResponse.json();
    const result: Result = await resultResponse.json();
    const metaData: Metadata = {
      title: `${result.config.question} - ${meta.reporter}`,
      description: `${result.overview}`,
    };

    // visibilityが"unlisted"の場合、noindexを設定
    if (result.visibility === ReportVisibility.UNLISTED) {
      metaData.robots = {
        index: false,
        follow: false,
      };
    }

    // 静的エクスポート時はmetadataBaseを設定しない（相対パスを使用するため）
    if (process.env.NEXT_PUBLIC_OUTPUT_MODE !== "export") {
      // 開発環境やSSR時のみmetadataBaseを設定
      const defaultHost = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      metaData.metadataBase = new URL(defaultHost + getBasePath());
    }

    if (process.env.NEXT_PUBLIC_OUTPUT_MODE === "export") {
      metaData.openGraph = {
        images: [`${slug}/opengraph-image.png`],
      };
    }

    return metaData;
  } catch {
    return {};
  }
}

export default async function Page({ params }: PageProps) {
  const slug = (await params).slug;
  const metaResponse = await fetch(`${getApiBaseUrl()}/meta/metadata.json`, {
    next: { tags: ["meta"] } as any,
  });
  const resultResponse = await fetch(`${getApiBaseUrl()}/reports/${slug}`, {
    headers: {
      "x-api-key": process.env.NEXT_PUBLIC_PUBLIC_API_KEY || "",
      "Content-Type": "application/json",
    },
    next: { tags: [`report-${slug}`] } as any,
  });

  if (metaResponse.status === 404 || resultResponse.status === 404) {
    notFound();
  }

  const meta: Meta = await metaResponse.json();
  const result: Result = await resultResponse.json();

  return (
    <>
      <div className={"container"}>
        <Header />
        <Overview result={result} />
        <ClientContainer result={result} />
        <Analysis result={result} />
        <BackButton />
        <Separator my={12} maxW={"750px"} mx={"auto"} />
        <Box maxW={"750px"} mx={"auto"} mb={24}>
          <Reporter meta={meta} />
        </Box>
      </div>
      <Footer meta={meta} />
    </>
  );
}
