import React from "react";
import { Footer } from "@/components/KouchouAI/Footer";
import { Header } from "@/components/KouchouAI/Header";
import { Analysis } from "@/components/KouchouAI/report/Analysis";
import { BackButton } from "@/components/KouchouAI/report/BackButton";
import { ClientContainer } from "@/components/KouchouAI/report/ClientContainer";
import { Overview } from "@/components/KouchouAI/report/Overview";
import { Reporter } from "@/components/KouchouAI/reporter/Reporter";
import type { Meta, Result } from "@/type";
import { Box, Divider } from "@chakra-ui/react";
import type { Metadata } from "next";
import hierarchicalResult from "@/data/hierarchical_result.json";

interface RawHierarchicalResult {
  arguments: Array<{
    arg_id: string;
    argument: string;
    x: number;
    y: number;
    p: number;
    cluster_ids: string[];
    attributes: null;
    url: null;
  }>;
  clusters: Array<{
    level: number;
    id: string;
    label: string;
    takeaway: string;
    value: number;
    parent: string;
    density_rank_percentile: number;
  }>;
  comments: Record<string, { comment: string }>;
  propertyMap: Record<string, unknown>;
  translations: Record<string, unknown>;
  overview: string;
  config: any;
  comment_num: number;
}

// Remove PageProps since we no longer need slug parameter

export async function generateMetadata(): Promise<Metadata> {
  const meta: Meta = {
    isDefault: true,
    reporter: "Policy PR Hub",
    message: "政策PR Hubで分析されたレポートです"
  };
  
  const rawResult = hierarchicalResult as RawHierarchicalResult;
  const transformedResult = {
    ...rawResult,
    arguments: rawResult.arguments.map((arg, i: number) => ({
      ...arg,
      comment_id: i
    }))
  };
  const result: Result = transformedResult as unknown as Result;
  
  return {
    title: `${result.config.question} - ${meta.reporter}`,
    description: `${result.overview}`,
  };
}

export default function Page() {
  const meta: Meta = {
    isDefault: true,
    reporter: "Policy PR Hub",
    message: "政策PR Hubで分析されたレポートです"
  };
  
  const rawResult = hierarchicalResult as RawHierarchicalResult;
  const transformedResult = {
    ...rawResult,
    arguments: rawResult.arguments.map((arg, i: number) => ({
      ...arg,
      comment_id: i
    }))
  };
  const result: Result = transformedResult as unknown as Result;

  return (
    <>
      <div className="container">
        <Header />
        <Overview result={result} />
        <ClientContainer result={result} />
        <Analysis result={result} />
        <BackButton />
        <Divider my={12} maxW="750px" mx="auto" />
        <Box maxW="750px" mx="auto" mb={24}>
          <Reporter meta={meta} />
        </Box>
      </div>
      <Footer meta={meta} />
    </>
  );
}
