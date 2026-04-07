import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type WeeklyDigestTerm = {
  search_term: string;
  cost: number;
  impressions: number;
};

type WeeklyDigestEmailProps = {
  terms: WeeklyDigestTerm[];
  total: number;
  dateRange: string;
};

function formatMoney(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getDashboardUrl(): string {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ?? "https://wastedspend.app"
  ).replace(/\/$/, "");
  return `${base}/dashboard`;
}

export function WeeklyDigestEmail({
  terms,
  total,
  dateRange,
}: WeeklyDigestEmailProps) {
  const totalFormatted = formatMoney(total);
  const previewText = `Total wasted spend found: ${totalFormatted}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: "#e2e8f0", margin: 0, padding: "32px 16px" }}>
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 4px 24px rgba(15, 23, 42, 0.08)",
          }}
        >
          {/* Dark header */}
          <Section
            style={{
              backgroundColor: "#0f172a",
              padding: "32px 28px",
            }}
          >
            <Heading
              as="h1"
              style={{
                color: "#ffffff",
                fontSize: "24px",
                fontWeight: 600,
                margin: "0 0 8px 0",
                lineHeight: 1.3,
              }}
            >
              Wasted Spend Weekly Report
            </Heading>
            <Text
              style={{
                color: "#94a3b8",
                fontSize: "14px",
                margin: 0,
              }}
            >
              {dateRange}
            </Text>
          </Section>

          {/* White body */}
          <Section style={{ padding: "28px 28px 8px 28px" }}>
            <Text
              style={{
                color: "#64748b",
                fontSize: "13px",
                textTransform: "uppercase" as const,
                letterSpacing: "0.05em",
                fontWeight: 600,
                margin: "0 0 8px 0",
              }}
            >
              Total wasted spend found
            </Text>
            <Text
              style={{
                color: "#0d9f6e",
                fontSize: "36px",
                fontWeight: 700,
                margin: "0 0 24px 0",
                lineHeight: 1.1,
              }}
            >
              {totalFormatted}
            </Text>

            <Heading
              as="h2"
              style={{
                color: "#0f172a",
                fontSize: "16px",
                fontWeight: 600,
                margin: "0 0 12px 0",
              }}
            >
              Top wasteful search terms
            </Heading>

            <table
              cellPadding={0}
              cellSpacing={0}
              role="presentation"
              style={{
                width: "100%",
                borderCollapse: "collapse" as const,
                marginBottom: "24px",
              }}
            >
              <thead>
                <tr>
                  <th
                    align="left"
                    style={{
                      backgroundColor: "#f1f5f9",
                      color: "#475569",
                      fontSize: "12px",
                      fontWeight: 600,
                      padding: "10px 12px",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    Search term
                  </th>
                  <th
                    align="right"
                    style={{
                      backgroundColor: "#f1f5f9",
                      color: "#475569",
                      fontSize: "12px",
                      fontWeight: 600,
                      padding: "10px 12px",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    Cost
                  </th>
                  <th
                    align="right"
                    style={{
                      backgroundColor: "#f1f5f9",
                      color: "#475569",
                      fontSize: "12px",
                      fontWeight: 600,
                      padding: "10px 12px",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    Impressions
                  </th>
                </tr>
              </thead>
              <tbody>
                {terms.map((row, i) => (
                  <tr key={`${row.search_term}-${i}`}>
                    <td
                      style={{
                        color: "#0f172a",
                        fontSize: "14px",
                        padding: "12px",
                        borderBottom: "1px solid #f1f5f9",
                        maxWidth: "240px",
                        wordBreak: "break-word" as const,
                      }}
                    >
                      {row.search_term}
                    </td>
                    <td
                      align="right"
                      style={{
                        color: "#0f172a",
                        fontSize: "14px",
                        padding: "12px",
                        borderBottom: "1px solid #f1f5f9",
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {formatMoney(row.cost)}
                    </td>
                    <td
                      align="right"
                      style={{
                        color: "#64748b",
                        fontSize: "14px",
                        padding: "12px",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      {row.impressions.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {terms.length === 0 ? (
              <Text style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>
                No high-spend, zero-conversion terms matched our thresholds this week.
                Check your dashboard for the full picture.
              </Text>
            ) : null}

            <Section style={{ textAlign: "center" as const, margin: "8px 0 24px 0" }}>
              <Button
                href={getDashboardUrl()}
                style={{
                  backgroundColor: "#0d9f6e",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 600,
                  textDecoration: "none",
                  textAlign: "center" as const,
                  display: "inline-block",
                  padding: "14px 28px",
                  borderRadius: "8px",
                }}
              >
                Review and block these now
              </Button>
            </Section>

            <Hr style={{ borderColor: "#e2e8f0", margin: "24px 0" }} />

            <Text
              style={{
                color: "#94a3b8",
                fontSize: "12px",
                lineHeight: 1.6,
                margin: 0,
                textAlign: "center" as const,
              }}
            >
              You&apos;re receiving this because you connected your Google Ads account
              to Wasted Spend. $49/month · Cancel anytime
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
