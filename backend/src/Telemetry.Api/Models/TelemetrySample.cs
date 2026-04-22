namespace Telemetry.Api.Models
{
    public class TelemetrySample
    {
        public string TelemetryId { get; set; } = string.Empty;
        public DateTime TimestampUtc { get; set; }
        public double Value { get; set; }
    }
}