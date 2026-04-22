using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Telemetry.Api.Services
{
    public class TelemetryDbContextFactory : IDesignTimeDbContextFactory<TelemetryDbContext>
    {
        public TelemetryDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<TelemetryDbContext>();
            optionsBuilder.UseSqlite("Data Source=telemetry.db");
            return new TelemetryDbContext(optionsBuilder.Options);
        }
    }
}
