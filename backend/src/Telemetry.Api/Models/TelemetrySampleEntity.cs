using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Telemetry.Api.Models
{
    [Table("TelemetrySamples")]
    public class TelemetrySampleEntity
    {
        [Key]
        public long SampleId { get; set; }
        public string TelemetryId { get; set; } = string.Empty;
        public DateTime TimestampUtc { get; set; }
        public double Value { get; set; }
    }
}