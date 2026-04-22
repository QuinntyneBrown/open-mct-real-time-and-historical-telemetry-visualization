using Microsoft.EntityFrameworkCore;
using Telemetry.Api.Models;

namespace Telemetry.Api.Services
{
    public class TelemetryDbContext : DbContext
    {
        public TelemetryDbContext(DbContextOptions<TelemetryDbContext> options) : base(options) { }
        public DbSet<TelemetrySampleEntity> TelemetrySamples => Set<TelemetrySampleEntity>();
    }

    public class TelemetryRepository
    {
        private readonly TelemetryDbContext _db;
        private readonly ILogger<TelemetryRepository> _logger;
        public TelemetryRepository(TelemetryDbContext db, ILogger<TelemetryRepository> logger)
        {
            _db = db;
            _logger = logger;
        }
        public async Task InsertBatchAsync(IEnumerable<TelemetrySampleEntity> samples, CancellationToken ct)
        {
            try
            {
                await _db.TelemetrySamples.AddRangeAsync(samples, ct);
                await _db.SaveChangesAsync(ct);
                _logger.LogInformation($"Inserted {samples.Count()} samples");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to insert telemetry batch");
            }
        }
        public async Task<TelemetryHistoryCursorResponse> GetHistoryPageAsync(TelemetryHistoryCursorRequest req, CancellationToken ct)
        {
            var query = _db.TelemetrySamples
                .Where(x => x.TelemetryId == req.TelemetryId);

            if (req.CursorTimestampUtc.HasValue && req.CursorSampleId.HasValue)
            {
                if (req.Direction == "Older")
                {
                    query = query.Where(x => x.TimestampUtc < req.CursorTimestampUtc.Value ||
                        (x.TimestampUtc == req.CursorTimestampUtc.Value && x.SampleId < req.CursorSampleId.Value));
                    query = query.OrderByDescending(x => x.TimestampUtc).ThenByDescending(x => x.SampleId);
                }
                else
                {
                    query = query.Where(x => x.TimestampUtc > req.CursorTimestampUtc.Value ||
                        (x.TimestampUtc == req.CursorTimestampUtc.Value && x.SampleId > req.CursorSampleId.Value));
                    query = query.OrderBy(x => x.TimestampUtc).ThenBy(x => x.SampleId);
                }
            }
            else
            {
                query = query.OrderByDescending(x => x.TimestampUtc).ThenByDescending(x => x.SampleId);
            }

            var page = await query.Take(req.PageSize).ToListAsync(ct);
            if (req.Direction == "Older")
                page.Reverse(); // Return ascending order

            var response = new TelemetryHistoryCursorResponse
            {
                Samples = page
            };
            if (page.Count > 0)
            {
                response.PreviousCursor = new TelemetryHistoryCursor
                {
                    TimestampUtc = page.First().TimestampUtc,
                    SampleId = page.First().SampleId
                };
                response.NextCursor = new TelemetryHistoryCursor
                {
                    TimestampUtc = page.Last().TimestampUtc,
                    SampleId = page.Last().SampleId
                };
                response.HasPrevious = await _db.TelemetrySamples.AnyAsync(x => x.TelemetryId == req.TelemetryId &&
                    (x.TimestampUtc < page.First().TimestampUtc ||
                    (x.TimestampUtc == page.First().TimestampUtc && x.SampleId < page.First().SampleId)), ct);
                response.HasNext = await _db.TelemetrySamples.AnyAsync(x => x.TelemetryId == req.TelemetryId &&
                    (x.TimestampUtc > page.Last().TimestampUtc ||
                    (x.TimestampUtc == page.Last().TimestampUtc && x.SampleId > page.Last().SampleId)), ct);
            }
            return response;
        }
    }
}