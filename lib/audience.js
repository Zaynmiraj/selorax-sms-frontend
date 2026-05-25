// Human-readable label for a campaign's audience source, derived from
// audience_type + audience_data (which may arrive as a JSON string from MySQL).
export function audienceLabel(campaign) {
    if (!campaign) return "";
    let data = campaign.audience_data;
    if (typeof data === "string") {
        try { data = JSON.parse(data); } catch { data = {}; }
    }
    data = data || {};

    switch (campaign.audience_type) {
        case "segment":
            return data.segment_name ? `Segment: ${data.segment_name}` : "Saved segment";
        case "filter":
            return "Filtered customers";
        case "csv":
            return "CSV upload";
        case "manual":
        default:
            return "Manual list";
    }
}
