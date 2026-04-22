using System.Collections.Generic;

namespace Telemetry.Api.Models
{
    public class TelemetryHistoryCursorResponse
    {
        public List<TelemetrySampleEntity> Samples { get; set; } = new();
        public TelemetryHistoryCursor? PreviousCursor { get; set; }
        public TelemetryHistoryCursor? NextCursor { get; set; }
        public bool HasPrevious { get; set; }
        public bool HasNext { get; set; }
    }

    public class TelemetryHistoryCursor
    {
        public DateTime TimestampUtc { get; set; }
        public long SampleId { get; set; }
    }
}