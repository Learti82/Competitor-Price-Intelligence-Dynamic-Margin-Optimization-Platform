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

    // Fetch rich context data for the AI
    const [
      topByMargin,
      bottomByMargin,
      pendingRecs,
      recentAlerts,
      allProducts,
      competitors,
    ] = await Promise.all([
      db.product.findMany({
        where: { companyId: company.id, isActive: true },
        orderBy: { currentMargin: "desc" },
        take: 5,
        select: { name: true, currentPrice: true, currentMargin: true, category: true, sku: true, brand: true },
      }),
      db.product.findMany({
        where: { companyId: company.id, isActive: true },
        orderBy: { currentMargin: "asc" },
        take: 5,
        select: { name: true, currentPrice: true, currentMargin: true, category: true, sku: true },
      }),
      db.priceRecommendation.findMany({
        where: { companyId: company.id, status: "PENDING" },
        include: { product: { select: { name: true, currentPrice: true, currentMargin: true } } },
        orderBy: { expectedRevenueDelta: "desc" },
        take: 5,
      }),
      db.marginAlert.findMany({
        where: { companyId: company.id, isRead: false },
        orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
        take: 5,
        select: { title: true, severity: true, description: true, alertType: true },
      }),
      db.product.aggregate({
        where: { companyId: company.id, isActive: true },
        _avg: { currentMargin: true },
        _count: { id: true },
      }),
      db.competitor.findMany({
        where: { companyLinks: { some: { companyId: company.id, isTracked: true } } },
        select: { name: true, pricingStrategy: true, numberOfStores: true },
      }),
    ]);

    const context = {
      company: { name: company.name, currency: company.currency, country: company.country },
      summary: {
        totalProducts: allProducts._count.id,
        avgMargin: parseFloat((allProducts._avg.currentMargin ?? 0).toFixed(1)),
        pendingRecsCount: pendingRecs.length,
        unreadAlertsCount: recentAlerts.length,
      },
      topMarginProducts: topByMargin,
      lowestMarginProducts: bottomByMargin,
      topOpportunities: pendingRecs.map((r) => ({
        product: r.product.name,
        currentPrice: r.product.currentPrice,
        recommendedPrice: r.recommendedPrice,
        expectedDailyGain: parseFloat(r.expectedRevenueDelta.toFixed(2)),
        confidence: parseFloat((r.confidenceScore * 100).toFixed(0)),
        rationale: r.rationaleAlbanian,
      })),
      activeAlerts: recentAlerts,
      trackedCompetitors: competitors,
    };

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Smart mock response using real company data
      const msg = message.toLowerCase();
      let reply = "";

      if (msg.includes("marzh") || msg.includes("margin")) {
        const lowest = bottomByMargin[0];
        reply = `Marzhi mesatar për ${company.name} është **${context.summary.avgMargin}%**.\n\n` +
          `Produkti me marzhë më të ulët: **${lowest?.name}** me vetëm **${lowest?.currentMargin?.toFixed(1)}%**.\n\n` +
          `Ke **${pendingRecs.length} rekomandime** aktive AI për të optimizuar marzhin. ` +
          `Mundësia më e madhe: **${pendingRecs[0]?.product?.name}** — mund të fitosh **€${pendingRecs[0]?.expectedRevenueDelta?.toFixed(2)}/ditë** duke ndryshuar çmimin nga €${pendingRecs[0]?.product?.currentPrice?.toFixed(2)} në €${pendingRecs[0]?.recommendedPrice?.toFixed(2)}.`;
      } else if (msg.includes("konkurrent") || msg.includes("competitor")) {
        reply = `Ke **${competitors.length} konkurrentë** të monitoruar:\n\n` +
          competitors.slice(0, 5).map((c) => `• **${c.name}** — ${c.pricingStrategy ?? "strategji e panjohur"} (${c.numberOfStores} dyqane)`).join("\n") +
          `\n\nShko te **Çmimet Live** për të parë krahasimin e plotë të çmimeve.`;
      } else if (msg.includes("rekomand") || msg.includes("recommendation")) {
        if (pendingRecs.length === 0) {
          reply = "Nuk ka rekomandime aktive për momentin. Sistemi gjeneron rekomandime të reja automatikisht bazuar në ndryshimet e çmimeve të konkurrentëve.";
        } else {
          reply = `Ke **${pendingRecs.length} rekomandime** aktive:\n\n` +
            pendingRecs.slice(0, 3).map((r, i) =>
              `${i + 1}. **${r.product.name}**: €${r.product.currentPrice?.toFixed(2)} → €${r.recommendedPrice?.toFixed(2)} (+€${r.expectedRevenueDelta?.toFixed(2)}/ditë, ${(r.confidenceScore * 100).toFixed(0)}% besim)`
            ).join("\n");
        }
      } else if (msg.includes("alert") || msg.includes("njoftim")) {
        if (recentAlerts.length === 0) {
          reply = "Nuk ka njoftime të palexuara. Sistemi do të të njoftojë automatikisht kur ka ndryshime të rëndësishme.";
        } else {
          reply = `Ke **${recentAlerts.length} njoftime** të palexuara:\n\n` +
            recentAlerts.slice(0, 3).map((a) => `• **[${a.severity}]** ${a.title}`).join("\n");
        }
      } else {
        reply = `**PriceSync AI** — Pasqyrë e ${company.name}:\n\n` +
          `📊 **${context.summary.totalProducts}** produkte aktive | Marzhi mes.: **${context.summary.avgMargin}%**\n` +
          `💡 **${pendingRecs.length}** rekomandime AI në pritje\n` +
          `🔔 **${recentAlerts.length}** njoftime të palexuara\n` +
          `🏪 **${competitors.length}** konkurrentë të monitoruar\n\n` +
          `_Mund të pyes për marzhet, konkurrentët, rekomandimet, ose produktet specifike._\n\n` +
          `_(Për përgjigje me inteligjencë artificiale të plotë, shto ANTHROPIC_API_KEY në .env)_`;
      }

      return NextResponse.json({ reply });
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
        system: `You are PriceSync AI, a pricing intelligence assistant for ${company.name}, a retail company in Kosovo.

Current data context:
${JSON.stringify(context, null, 2)}

Instructions:
- Answer questions about pricing, margins, competitors, and strategy
- Be concise, specific, and use real numbers from the context
- Use € for currency and % for margins
- Respond in Albanian (shqip) unless the user writes in English
- Format answers with bold text and bullet points for readability
- When suggesting actions, link to specific pages (e.g. "Shko te Rekomandimet")`,
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await response.json();
    return NextResponse.json({ reply: data.content?.[0]?.text ?? "Nuk mund ta procesoj kërkesën." });
  } catch (err) {
    console.error("Chat POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
