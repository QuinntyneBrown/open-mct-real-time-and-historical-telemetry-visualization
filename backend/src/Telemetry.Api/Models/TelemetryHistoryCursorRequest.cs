namespace Telemetry.Api.Models
{
    public class TelemetryHistoryCursorRequest
    {
        public string TelemetryId { get; set; } = string.Empty;
        public DateTime? CursorTimestampUtc { get; set; }
        public long? CursorSampleId { get; set; }
        public int PageSize { get; set; } = 100;
        public string Direction { get; set; } = "Older"; // or "Newer"
    }
}