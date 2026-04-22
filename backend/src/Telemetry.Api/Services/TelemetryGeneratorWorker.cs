using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Telemetry.Api.Configuration;
using Telemetry.Api.Models;
using System.Collections.Concurrent;
using System.Threading.Channels;

namespace Telemetry.Api.Services
{
    public class TelemetryGeneratorWorker : BackgroundService
    {
        private readonly TelemetryOptions _options;
        private readonly ConcurrentDictionary<string, double> _lastValues = new();
        private readonly Channel<TelemetrySample> _channel;
        private readonly Random _random = new();

        public TelemetryGeneratorWorker(IOptions<TelemetryOptions> options, Channel<TelemetrySample> channel)
        {
            _options = options.Value;
            _channel = channel;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var now = DateTime.UtcNow;
                foreach (var id in _options.TelemetryIdentifiers)
                {
                    var value = _lastValues.AddOrUpdate(id, _ => _random.NextDouble() * 100, (_, last) => last + _random.NextDouble() - 0.5);
                    var sample = new TelemetrySample { TelemetryId = id, TimestampUtc = now, Value = value };
                    await _channel.Writer.WriteAsync(sample, stoppingToken);
                }
                await Task.Delay(50, stoppingToken);
            }
        }
    }
}