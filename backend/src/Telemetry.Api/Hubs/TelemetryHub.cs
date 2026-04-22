using Microsoft.AspNetCore.SignalR;

namespace Telemetry.Api.Hubs
{
    public class TelemetryHub : Hub
    {
        public async Task SubscribeTelemetry(string telemetryId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"telemetry:{telemetryId}");
        }

        public async Task UnsubscribeTelemetry(string telemetryId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"telemetry:{telemetryId}");
        }
    }
}