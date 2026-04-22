using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using Telemetry.Api.Hubs;
using Telemetry.Api.Models;
using System.Threading.Channels;
using System.Collections.Generic;

namespace Telemetry.Api.Services
{
    public class TelemetryDispatchWorker : BackgroundService
    {
        private readonly Channel<TelemetrySample> _channel;
        private readonly IHubContext<TelemetryHub> _hubContext;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<TelemetryDispatchWorker> _logger;
        private const int BatchSize = 100;
        private const int BatchIntervalMs = 500;

        public TelemetryDispatchWorker(
            Channel<TelemetrySample> channel,
            IHubContext<TelemetryHub> hubContext,
            IServiceScopeFactory scopeFactory,
            ILogger<TelemetryDispatchWorker> logger)
        {
            _channel = channel;
            _hubContext = hubContext;
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var batch = new List<TelemetrySampleEntity>(BatchSize);
            var lastFlush = DateTime.UtcNow;
            await foreach (var sample in _channel.Reader.ReadAllAsync(stoppingToken))
            {
                // SignalR live delivery
                await _hubContext.Clients.Group($"telemetry:{sample.TelemetryId}").SendAsync("ReceiveTelemetry", sample, stoppingToken);
                // Batch for DB
                batch.Add(new TelemetrySampleEntity
                {
                    TelemetryId = sample.TelemetryId,
                    TimestampUtc = sample.TimestampUtc,
                    Value = sample.Value
                });
                if (batch.Count >= BatchSize || (DateTime.UtcNow - lastFlush).TotalMilliseconds > BatchIntervalMs)
                {
                    await FlushBatchAsync(batch, stoppingToken);
                    batch.Clear();
                    lastFlush = DateTime.UtcNow;
                }
            }
            if (batch.Count > 0)
            {
                await FlushBatchAsync(batch, stoppingToken);
            }
        }

        private async Task FlushBatchAsync(List<TelemetrySampleEntity> batch, CancellationToken stoppingToken)
        {
            using var scope = _scopeFactory.CreateScope();
            var repository = scope.ServiceProvider.GetRequiredService<TelemetryRepository>();
            await repository.InsertBatchAsync(batch, stoppingToken);
        }
    }
}
