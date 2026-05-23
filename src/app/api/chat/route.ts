import { requireCompany } from "@/lib/get-company";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const company = await requireCompany();
    if (!company) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const message: string = body.message ?? "";

    if (!message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Fetch summary data: top 5 products by margin, recent recommendations count, avg margin
    const [topProducts, recentRecommendationsCount, allProducts] = await Promise.all([
      db.product.findMany({
        where: { companyId: company.id, isActive: true },
        orderBy: { currentMargin: "desc" },
        take: 5,
        select: {
          name: true,
          currentPrice: true,
          currentMargin: true,
          category: true,
          sku: true,
        },
      }),
      db.priceRecommendation.count({
        where: {
          companyId: company.id,
          status: "PENDING",
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      db.product.aggregate({
        where: { companyId: company.id, isActive: true },
        _avg: { currentMargin: true },
      }),
    ]);

    const summaryData = {
      companyName: company.name,
      currency: company.currency,
      topProductsByMargin: topProducts,
      recentRecommendationsCount,
      avgMargin: allProducts._avg.currentMargin ?? 0,
    };

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Return a mock reply using company data
      const mockReply = `[Mock AI Response] Based on your data for ${company.name}: You have ${recentRecommendationsCount} pending pricing recommendations. Your average margin is ${(summaryData.avgMargin).toFixed(1)}%. Your top product by margin is "${topProducts[0]?.name ?? "N/A"}" at ${topProducts[0]?.currentMargin?.toFixed(1) ?? 0}%. Consider reviewing competitor prices to optimize your pricing strategy.`;
      return NextResponse.json({ reply: mockReply });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-7",
        max_tokens: 1024,
        system: `You are PriceSync AI, a pricing intelligence assistant for ${company.name}.
Context: ${JSON.stringify(summaryData)}.
Answer questions about pricing, margins, and competitor strategy. Be concise and use €/% units.`,
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await response.json();
    return NextResponse.json({ reply: data.content?.[0]?.text ?? "I couldn't process that." });
  } catch (err) {
    console.error("Chat POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
